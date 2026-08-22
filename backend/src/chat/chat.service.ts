import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider.types'
import { REDIS_CLIENT } from '../redis/redis.module'
import { hasNonLatinLeak, isContaminated, sanitizeContent } from './chat-guards'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, RETRY_NUDGE, SUMMARY_PROMPT, SYSTEM_PROMPT } from './chat-prompts'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Günlük model bütçesi: kötüye kullanım kotayı bitirip gerçek müşterinin
// chatbot'unu susturmasın diye chatbot yoluna devre kesici konur.
// Proje auto-fill tarafı bu bütçeden BAĞIMSIZDIR.
const DEFAULT_DAILY_LIMIT = 1000
const BUDGET_KEY_PREFIX = 'ai:chat:daily:'
const BUDGET_KEY_TTL_SECONDS = 48 * 60 * 60

export const BUDGET_EXCEEDED_MESSAGE =
  'I cannot reply right now because of high demand. Press the "Continue on WhatsApp" ' +
  'button below to send your request straight to the Pulse Recipe kitchen team.'

export class AiBudgetExceededError extends Error {
  constructor() {
    super('Günlük model bütçesi aşıldı')
  }
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private config: ConfigService,
    @Inject(AI_PROVIDER) private ai: AiProvider,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // true → istek bütçeye sığdı; false → günlük limit doldu.
  // Redis erişilemezse fail-open: chatbot bütçe yüzünden hiç susmasın.
  private async consumeDailyBudget(): Promise<boolean> {
    // AI_DAILY_LIMIT is the new name; GROQ_DAILY_LIMIT still works so an
    // existing deployment keeps its configured ceiling until the env is updated.
    const configured =
      this.config.get<string>('AI_DAILY_LIMIT') ?? this.config.get<string>('GROQ_DAILY_LIMIT')
    const limit = Number(configured ?? DEFAULT_DAILY_LIMIT)
    if (!Number.isFinite(limit) || limit <= 0) return true

    try {
      const key = `${BUDGET_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`
      const count = await this.redis.incr(key)
      if (count === 1) await this.redis.expire(key, BUDGET_KEY_TTL_SECONDS)
      if (count > limit) {
        // Log seline dönmesin: yalnızca eşiğin aşıldığı ilk istekte error bas
        if (count === limit + 1) this.logger.error(`Günlük model bütçesi aşıldı (limit: ${limit})`)
        return false
      }
      return true
    } catch (err) {
      this.logger.warn(
        `Bütçe sayacı okunamadı, istek engellenmedi: ${err instanceof Error ? err.message : err}`,
      )
      return true
    }
  }

  private async callModel(systemPrompt: string, messages: ChatMessage[], maxTokens = 400): Promise<string> {
    if (!(await this.consumeDailyBudget())) {
      throw new AiBudgetExceededError()
    }

    let content: string
    try {
      content = await this.ai.generateText({
        operation: 'chat-reply',
        instructions: systemPrompt,
        messages: messages.slice(-12),
        maxOutputTokens: maxTokens,
      })
    } catch {
      // The provider already logged the vendor detail with secrets redacted.
      this.logger.error('chat-reply generation failed')
      throw new ServiceUnavailableException('Yanıt alınamadı, lütfen tekrar deneyin')
    }
    // Cevap geçmişe geri döneceği için modeli de sanitize et; ayraç vb. kalıntılar
    // sonraki isteklerde injection filtresine takılmasın
    return sanitizeContent(content)
  }

  // LLM judge (4.2): catches Latin-script leaks the heuristics cannot see, with a
  // cheap 8B call. Fail-open when the judge is unreachable/unclear — same philosophy
  // as the budget counter: the chatbot is never silenced for the sake of language purity.
  // consumeDailyBudget is deliberately NOT called: every judge is bound 1:1 to an
  // already budgeted generation, so total usage stays within budget×MAX_CHAT_ATTEMPTS.
  private async isEnglishByJudge(text: string): Promise<boolean> {
    let verdict: string
    try {
      verdict = await this.ai.generateText({
        operation: 'chat-language-judge',
        instructions: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: judgeUserMessage(text) }],
        // The verdict is one word, but reasoning models draw thinking tokens
        // from the same budget; the client adds its own head room on top.
        maxOutputTokens: 16,
        // A judge is an optional quality gate — never make the user wait on
        // retries for it; a failure fails open one line below.
        retries: 0,
      })
    } catch {
      this.logger.warn('Language judge unreachable, reply accepted')
      return true
    }
    if (!verdict.trim()) {
      this.logger.warn('Language judge returned an empty verdict, reply accepted')
      return true
    }
    // The verdict is searched anywhere in the text (decorations like "Verdict: NO"
    // were escaping startsWith); word boundaries keep NO from matching "NOTHING".
    // NO takes priority — a wrong NO costs at most one extra regeneration, while a
    // wrong YES lets a leak through unchecked.
    const normalized = verdict.trim().toUpperCase()
    if (/\bNO\b/.test(normalized)) return false
    if (!/\bYES\b/.test(normalized)) {
      this.logger.warn(`Language judge gave an unexpected verdict, accepted: "${verdict.slice(0, 40)}"`)
    }
    return true
  }

  // Deterministic guards (cheap) first; if they say clean, the judge has the last word
  private async isLeaky(text: string): Promise<boolean> {
    if (isContaminated(text)) return true
    return !(await this.isEnglishByJudge(text))
  }

  // Kullanıcıya göstermeden en fazla bu kadar üretim denenir; hepsi sızarsa sabit
  // mesaja düşülür. 2026-08-17'de canlıda 2 denemenin (ilk + tek retry) ikisi de
  // sızdırıp kullanıcıyı sabit hata mesajıyla baş başa bıraktığı görüldü — üçüncü
  // deneme, ekstra model bütçesi karşılığında bu sert düşüşü nadirleştirir.
  private static readonly MAX_CHAT_ATTEMPTS = 3

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      for (let attempt = 1; attempt <= ChatService.MAX_CHAT_ATTEMPTS; attempt++) {
        // İlk deneme düz sistem promptuyla, sonrakiler düzeltici talimatla yapılır
        // (kör tekrar aynı sızıntıyı yeniden üretebiliyor)
        const systemPrompt = attempt === 1 ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\n${RETRY_NUDGE}`
        const reply = await this.callModel(systemPrompt, messages, 400)
        if (!(await this.isLeaky(reply))) return reply

        const isLastAttempt = attempt === ChatService.MAX_CHAT_ATTEMPTS
        this.logger.warn(
          isLastAttempt
            ? `Leak on attempt ${attempt} as well, fell back to the fixed message: "${reply.slice(0, 120)}"`
            : `Foreign language leak (attempt ${attempt}/${ChatService.MAX_CHAT_ATTEMPTS}), regenerating reply: "${reply.slice(0, 120)}"`,
        )
      }
      return 'Sorry, something went wrong while composing a reply. Could you write your question again?'
    } catch (err) {
      // Bütçe dolduğunda hata yerine normal cevap gibi sabit mesaj dön;
      // frontend'de WhatsApp butonu görünür kalır
      if (err instanceof AiBudgetExceededError) return BUDGET_EXCEEDED_MESSAGE
      throw err
    }
  }

  async generateSummary(messages: ChatMessage[]): Promise<string> {
    let text: string
    try {
      text = await this.callModel(SUMMARY_PROMPT, messages, 300)
    } catch (err) {
      // Frontend 503'te düz wa.me linkine düşüyor; bütçe aşımında da aynı yol
      if (err instanceof AiBudgetExceededError) {
        throw new ServiceUnavailableException('Özet oluşturulamadı')
      }
      throw err
    }
    // Özet bilinçli olarak foreign-word ön-filtresine girmez (şablon markalı terim
    // içerir); alfabe kontrolü + judge yeterli
    if (hasNonLatinLeak(text) || !(await this.isEnglishByJudge(text))) {
      // Frontend falls back to a plain wa.me link on error; never ship a broken summary
      this.logger.warn(`Non-English summary rejected: "${text.slice(0, 120)}"`)
      throw new ServiceUnavailableException('Özet oluşturulamadı')
    }
    return text
  }
}
