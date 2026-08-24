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
import { isContaminated, sanitizeContent } from './chat-guards'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, RETRY_NUDGE, SYSTEM_PROMPT } from './chat-prompts'

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

// Shown whenever no usable reply can be produced (daily budget spent, or every
// attempt drifted out of the reader's language). It names only things the site
// actually has: the recipes and the contact page.
export const FALLBACK_MESSAGE =
  "I'm unable to prepare a complete response right now. Please try again in a moment, " +
  'browse our published recipes, or use the contact page if you need to report a problem.'

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

  // LLM judge (4.2): catches the drifts the heuristics cannot see, with a cheap
  // 8B call comparing the reply's language to the reader's. Fail-open when the
  // judge is unreachable/unclear — same philosophy as the budget counter: the
  // chatbot is never silenced for the sake of language purity.
  // consumeDailyBudget is deliberately NOT called: every judge is bound 1:1 to an
  // already budgeted generation, so total usage stays within budget×MAX_CHAT_ATTEMPTS.
  private async speaksReaderLanguage(text: string, readerText: string): Promise<boolean> {
    let verdict: string
    try {
      verdict = await this.ai.generateText({
        operation: 'chat-language-judge',
        instructions: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: judgeUserMessage(text, readerText) }],
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

  // The reply has to speak the reader's language. The deterministic guards only
  // apply when the reader wrote English — they are a Turkish-leak detector, and a
  // Turkish reply to a Turkish reader is now correct, not a leak. Everything else
  // is left to the judge, which compares the two languages directly.
  private async isLeaky(text: string, readerText: string): Promise<boolean> {
    if (!readerText) return false
    if (!isContaminated(readerText) && isContaminated(text)) return true
    return !(await this.speaksReaderLanguage(text, readerText))
  }

  // Kullanıcıya göstermeden en fazla bu kadar üretim denenir; hepsi sızarsa sabit
  // mesaja düşülür. 2026-08-17'de canlıda 2 denemenin (ilk + tek retry) ikisi de
  // sızdırıp kullanıcıyı sabit hata mesajıyla baş başa bıraktığı görüldü — üçüncü
  // deneme, ekstra model bütçesi karşılığında bu sert düşüşü nadirleştirir.
  private static readonly MAX_CHAT_ATTEMPTS = 3

  async chat(messages: ChatMessage[]): Promise<string> {
    // The language to mirror is the one the reader just used, not the one the
    // conversation opened in: a reader who switches language is followed.
    const readerText = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    try {
      for (let attempt = 1; attempt <= ChatService.MAX_CHAT_ATTEMPTS; attempt++) {
        // İlk deneme düz sistem promptuyla, sonrakiler düzeltici talimatla yapılır
        // (kör tekrar aynı sızıntıyı yeniden üretebiliyor)
        const systemPrompt = attempt === 1 ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\n${RETRY_NUDGE}`
        const reply = await this.callModel(systemPrompt, messages, 400)
        if (!(await this.isLeaky(reply, readerText))) return reply

        const isLastAttempt = attempt === ChatService.MAX_CHAT_ATTEMPTS
        this.logger.warn(
          isLastAttempt
            ? `Language drift on attempt ${attempt} as well, fell back to the fixed message: "${reply.slice(0, 120)}"`
            : `Reply is not in the reader's language (attempt ${attempt}/${ChatService.MAX_CHAT_ATTEMPTS}), regenerating: "${reply.slice(0, 120)}"`,
        )
      }
      return FALLBACK_MESSAGE
    } catch (err) {
      // Bütçe dolduğunda hata yerine normal cevap gibi sabit mesaj dön:
      // konuşma açık kalır, kullanıcı biraz sonra tekrar deneyebilir
      if (err instanceof AiBudgetExceededError) return FALLBACK_MESSAGE
      throw err
    }
  }
}
