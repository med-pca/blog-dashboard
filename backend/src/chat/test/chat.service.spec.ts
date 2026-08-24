import { ConfigService } from '@nestjs/config'
import { ChatService, FALLBACK_MESSAGE } from '../chat.service'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, RETRY_NUDGE, SYSTEM_PROMPT } from '../chat-prompts'
import type { AiProvider, AiTextRequest } from '../../ai/ai-provider.types'

interface TestService {
  service: ChatService
  call: jest.Mock
  // Judge calls are identified through JUDGE_SYSTEM_PROMPT in the instructions
  judgeCallCount: () => number
  // Queues the next judge verdicts; null = provider failure. Empty queue means YES.
  setJudgeVerdicts: (...verdicts: (string | null)[]) => void
}

function makeService(...replies: string[]): TestService {
  const config = { get: () => undefined }
  const genQueue = [...replies]
  const judgeQueue: (string | null)[] = []

  const isJudgeRequest = (request: AiTextRequest): boolean => request.instructions === JUDGE_SYSTEM_PROMPT

  const call = jest.fn((request: AiTextRequest) => {
    if (isJudgeRequest(request)) {
      const verdict = judgeQueue.length ? judgeQueue.shift() : 'YES'
      // The provider throws on failure now; the judge must still fail open.
      if (verdict == null) return Promise.reject(new Error('provider unavailable'))
      return Promise.resolve(verdict)
    }
    return Promise.resolve(genQueue.shift() ?? '')
  })

  const ai = { name: 'openai', generateText: call, generateJson: jest.fn() }
  return {
    service: new ChatService(
      config as unknown as ConfigService,
      ai as unknown as AiProvider,
      // Default: the budget counter always allows; budget tests override it via withRedis
      { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() } as unknown as import('ioredis').Redis,
    ),
    call,
    judgeCallCount: () => call.mock.calls.filter(args => isJudgeRequest(args[0] as AiTextRequest)).length,
    setJudgeVerdicts: (...verdicts: (string | null)[]) => judgeQueue.push(...verdicts),
  }
}

const MESSAGES = [{ role: 'user' as const, content: 'hello' }]
const TURKISH_MESSAGES = [
  { role: 'user' as const, content: 'Merhaba, akşam yemeği için hızlı bir tarif önerir misin?' },
]

describe('ChatService — reader-language guard', () => {
  it('returns the model reply unchanged when it answers an English reader in English', async () => {
    const { service, call, judgeCallCount } = makeService('How many servings do you cook for?')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
    // clean path: 1 generation + 1 judge
    expect(call).toHaveBeenCalledTimes(2)
    expect(judgeCallCount()).toBe(1)
  })

  it('regenerates once when the reply to an English reader leaks foreign words', async () => {
    const { service, call, judgeCallCount } = makeService(
      'What is your aylik food budget?',
      'What is your monthly food budget?',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe('What is your monthly food budget?')
    // the judge is skipped on the dirty first reply: generation + generation + judge
    expect(call).toHaveBeenCalledTimes(3)
    expect(judgeCallCount()).toBe(1)
    // first generation has no nudge, the retry carries the corrective instruction
    const systemOf = (i: number) => (call.mock.calls[i][0] as AiTextRequest).instructions
    expect(systemOf(0)).not.toContain(RETRY_NUDGE)
    expect(systemOf(1)).toContain(RETRY_NUDGE)
  })

  it('regenerates a second time when the retry also leaks, then returns the clean third attempt', async () => {
    const { service, call, judgeCallCount } = makeService(
      'What is your aylik food budget?',
      'Are you cooking for a kalabalık table this week?',
      'Are you cooking for a big table this week?',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe('Are you cooking for a big table this week?')
    // the first two replies are deterministically dirty (judge skipped), the third is judged
    expect(call).toHaveBeenCalledTimes(4)
    expect(judgeCallCount()).toBe(1)
  })

  it('falls back to the fixed message when every attempt misses the reader language', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Tell me your budgetaylik and I will plan the week.',
      'Are you cooking for a kalabalık table this week?',
      'Kaç kişilik yemek pişiriyorsunuz?',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe(FALLBACK_MESSAGE)
    // all three replies are deterministically dirty: the judge is never called
    expect(call).toHaveBeenCalledTimes(3)
    expect(judgeCallCount()).toBe(0)
  })

  it('replaces a non-Latin reply to an English reader with the fixed message', async () => {
    const { service } = makeService(
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe(FALLBACK_MESSAGE)
  })

  // The point of the migration away from "English only": the answer follows the
  // reader instead of the site language.
  it('keeps a Turkish reply to a Turkish reader', async () => {
    const { service, judgeCallCount } = makeService(
      'Tabii, 20 dakikada hazır olan bir makarna tarifi öneriyorum.',
    )
    await expect(service.chat(TURKISH_MESSAGES)).resolves.toBe(
      'Tabii, 20 dakikada hazır olan bir makarna tarifi öneriyorum.',
    )
    // the Turkish-leak pre-filter is skipped for a Turkish reader; the judge decides
    expect(judgeCallCount()).toBe(1)
  })

  it('rejects an English reply to a Turkish reader when the judge says so', async () => {
    const { service, setJudgeVerdicts } = makeService(
      'How many servings do you cook for?',
      'Kaç kişilik yemek pişiriyorsunuz?',
    )
    setJudgeVerdicts('NO', 'YES')
    await expect(service.chat(TURKISH_MESSAGES)).resolves.toBe('Kaç kişilik yemek pişiriyorsunuz?')
  })

  it('mirrors the language of the LAST user message when the reader switches', async () => {
    const { service, call } = makeService('Tabii, hemen bir tarif önereyim.')
    await service.chat([
      { role: 'user', content: 'hello, any quick dinner ideas?' },
      { role: 'assistant', content: 'Sure, here is a quick one.' },
      ...TURKISH_MESSAGES,
    ])
    const judgeCall = call.mock.calls.find(
      args => (args[0] as AiTextRequest).instructions === JUDGE_SYSTEM_PROMPT,
    )
    expect((judgeCall?.[0] as AiTextRequest).messages[0].content).toContain(TURKISH_MESSAGES[0].content)
  })
})

describe('ChatService — LLM language judge', () => {
  it('regenerates when the judge rejects a heuristically clean reply', async () => {
    const { service, call, setJudgeVerdicts } = makeService(
      'Greetings, how may I be of assistance to you today?',
      'How many servings do you cook for?',
    )
    setJudgeVerdicts('NO', 'YES')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
    // generation + judge(NO) + generation + judge(YES)
    expect(call).toHaveBeenCalledTimes(4)
  })

  it('falls back to the fixed message when the judge rejects all attempts', async () => {
    const { service, call, setJudgeVerdicts } = makeService('First reply', 'Second reply', 'Third reply')
    setJudgeVerdicts('NO', 'NO', 'NO')
    await expect(service.chat(MESSAGES)).resolves.toBe(FALLBACK_MESSAGE)
    // three generations + three judges
    expect(call).toHaveBeenCalledTimes(6)
  })

  it('fails open when the judge is unreachable', async () => {
    const { service, setJudgeVerdicts } = makeService('How many servings do you cook for?')
    setJudgeVerdicts(null) // network error
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })

  it('fails open on an unexpected judge verdict', async () => {
    const { service, setJudgeVerdicts } = makeService('How many servings do you cook for?')
    setJudgeVerdicts('MAYBE')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })

  it('gives the judge both the reader message and the reply', async () => {
    const { service, call } = makeService('How many servings do you cook for?')
    await service.chat(MESSAGES)
    const judgeCall = call.mock.calls.find(
      args => (args[0] as AiTextRequest).instructions === JUDGE_SYSTEM_PROMPT,
    )
    expect((judgeCall?.[0] as AiTextRequest).messages[0].content).toBe(
      judgeUserMessage('How many servings do you cook for?', 'hello'),
    )
  })

  it('rejects when NO is embedded in a decorated verdict ("Verdict: NO")', async () => {
    const { service, setJudgeVerdicts } = makeService('First reply', 'How many servings do you cook for?')
    setJudgeVerdicts('Verdict: NO', 'YES')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })

  it('does not read NO out of a longer word ("NOTHING TO FLAG")', async () => {
    const { service, setJudgeVerdicts } = makeService('How many servings do you cook for?')
    setJudgeVerdicts('NOTHING TO FLAG')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })

  it('fails open when the judge echoes the text instead of answering (production 2026-07-17)', async () => {
    const { service, setJudgeVerdicts } = makeService('How many servings do you cook for?')
    setJudgeVerdicts('Servings for')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })
})

describe('ChatService — daily budget circuit breaker', () => {
  function withRedis(
    service: ChatService,
    incrResult: number | Error,
  ): { incr: jest.Mock; expire: jest.Mock } {
    const incr =
      incrResult instanceof Error
        ? jest.fn().mockRejectedValue(incrResult)
        : jest.fn().mockResolvedValue(incrResult)
    const redis = { incr, expire: jest.fn().mockResolvedValue(1) }
    ;(service as unknown as { redis: unknown }).redis = redis
    return redis
  }

  it('returns the fixed message without calling the model when the daily budget is exceeded', async () => {
    const { service, call } = makeService('unused reply')
    withRedis(service, 1001) // default limit is 1000

    await expect(service.chat(MESSAGES)).resolves.toBe(FALLBACK_MESSAGE)
    expect(call).not.toHaveBeenCalled()
  })

  it('allows the request and sets a TTL on the first increment of the day', async () => {
    const { service, judgeCallCount } = makeService('How many servings do you cook for?')
    const redis = withRedis(service, 1)

    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
    expect(redis.incr).toHaveBeenCalledWith(expect.stringMatching(/^ai:chat:daily:\d{4}-\d{2}-\d{2}$/))
    expect(redis.expire).toHaveBeenCalledTimes(1)
    // the judge does NOT consume the budget counter: 1 generation + 1 judge, incr called once
    expect(judgeCallCount()).toBe(1)
    expect(redis.incr).toHaveBeenCalledTimes(1)
  })

  it('fails open when Redis is unreachable', async () => {
    const { service } = makeService('How many servings do you cook for?')
    withRedis(service, new Error('connection refused'))

    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
  })
})

// Regression guard for the removed WhatsApp handoff: the assistant answers on
// the site, so nothing may point the reader at a channel or a button that does
// not exist.
describe('ChatService — no handoff left in the prompts or the fallback', () => {
  const FORBIDDEN = [/whatsapp/i, /continue on/i, /kitchen team/i, /handoff/i, /hand (the reader )?over/i]

  it.each(FORBIDDEN)('keeps %s out of the system prompt', pattern => {
    expect(SYSTEM_PROMPT).not.toMatch(pattern)
  })

  it.each(FORBIDDEN)('keeps %s out of the fallback message', pattern => {
    expect(FALLBACK_MESSAGE).not.toMatch(pattern)
  })

  it('never promises a button in the chat window', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/press the .* button/i)
    expect(SYSTEM_PROMPT).toMatch(/no chat button/i)
    expect(FALLBACK_MESSAGE).not.toMatch(/button/i)
  })

  it('does not blame demand or promise a human follow-up in the fallback', () => {
    expect(FALLBACK_MESSAGE).not.toMatch(/high demand/i)
    expect(FALLBACK_MESSAGE).toMatch(/contact page/i)
  })

  it('tells the model to answer in the chat, in the reader language, without inventing content', () => {
    expect(SYSTEM_PROMPT).toMatch(/same language the reader used/i)
    expect(SYSTEM_PROMPT).toMatch(/never invent recipe titles/i)
    expect(SYSTEM_PROMPT).toMatch(/\/recipes/)
    expect(SYSTEM_PROMPT).toMatch(/\/collections/)
    expect(SYSTEM_PROMPT).toMatch(/\/contact/)
  })

  it('caps clarification instead of interviewing the reader', () => {
    expect(SYSTEM_PROMPT).toMatch(/at most ONE short clarifying question/i)
    expect(SYSTEM_PROMPT).toMatch(/at most TWO clarifying questions/i)
  })

  // The model is mocked here, so what is under test is the pipeline: an answer
  // that follows the new prompt reaches the reader untouched instead of being
  // swallowed by the language guard or replaced by a handoff.
  it('passes an honest no-match answer through, section links included', async () => {
    const honest =
      'I do not have a published lasagna recipe yet. Browse /recipes for what is published, ' +
      '/collections for themed sets, or use /contact to reach the site.'
    const { service } = makeService(honest)
    await expect(service.chat([{ role: 'user', content: 'do you have a lasagna recipe?' }])).resolves.toBe(honest)
  })

  it('delivers the answer at the end of a two-question clarification flow', async () => {
    const answer =
      'Then roast the chicken thighs at 220 C for 25 minutes on one sheet pan. ' +
      'Add the potatoes at the start and the greens for the last 8 minutes.'
    const { service } = makeService(answer)
    await expect(
      service.chat([
        { role: 'user', content: 'quick dinner idea?' },
        { role: 'assistant', content: 'How much time do you have?' },
        { role: 'user', content: 'about 30 minutes' },
        { role: 'assistant', content: 'Cooking for how many?' },
        { role: 'user', content: 'four of us' },
      ]),
    ).resolves.toBe(answer)
  })

  it('no longer exposes a conversation summary generator', () => {
    const { service } = makeService()
    expect((service as unknown as Record<string, unknown>).generateSummary).toBeUndefined()
  })
})
