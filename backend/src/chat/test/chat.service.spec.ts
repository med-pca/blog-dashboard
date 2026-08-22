import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BUDGET_EXCEEDED_MESSAGE, ChatService } from '../chat.service'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, RETRY_NUDGE } from '../chat-prompts'
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

describe('ChatService — non-English output guard', () => {
  it('returns the model reply unchanged when English', async () => {
    const { service, call, judgeCallCount } = makeService('How many servings do you cook for?')
    await expect(service.chat(MESSAGES)).resolves.toBe('How many servings do you cook for?')
    // clean path: 1 generation + 1 judge
    expect(call).toHaveBeenCalledTimes(2)
    expect(judgeCallCount()).toBe(1)
  })

  it('regenerates once when reply leaks foreign words, then returns the clean retry', async () => {
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

  it('falls back to the fixed English message when all attempts leak', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Tell me your budgetaylik and I will plan the week.',
      'Are you cooking for a kalabalık table this week?',
      'Kaç kişilik yemek pişiriyorsunuz?',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Sorry, something went wrong while composing a reply. Could you write your question again?')
    // all three replies are deterministically dirty: the judge is never called
    expect(call).toHaveBeenCalledTimes(3)
    expect(judgeCallCount()).toBe(0)
  })

  it('replaces a non-Latin chat reply with the fixed message after all retries', async () => {
    const { service } = makeService(
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Sorry, something went wrong while composing a reply. Could you write your question again?')
  })

  it('throws 503 for non-Latin summary so frontend falls back to plain WhatsApp link', async () => {
    const { service, judgeCallCount } = makeService('Здравствуйте, я использовал систему консультаций')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
    // the script check short-circuits, the judge is never reached
    expect(judgeCallCount()).toBe(0)
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
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Sorry, something went wrong while composing a reply. Could you write your question again?')
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

  it('wraps the evaluated text in the TEXT/VERDICT template for the judge', async () => {
    const { service, call } = makeService('How many servings do you cook for?')
    await service.chat(MESSAGES)
    const judgeCall = call.mock.calls.find(
      args => (args[0] as AiTextRequest).instructions === JUDGE_SYSTEM_PROMPT,
    )
    expect((judgeCall?.[0] as AiTextRequest).messages[0].content).toBe(
      judgeUserMessage('How many servings do you cook for?'),
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

  it('rejects a summary when the judge says HAYIR', async () => {
    const { service, setJudgeVerdicts } = makeService('Hi, I would like detailed recipe suggestions.')
    setJudgeVerdicts('NO')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
  })

  it('returns the summary when the judge approves', async () => {
    const { service, judgeCallCount } = makeService('Hi, I would like detailed recipe suggestions.')
    await expect(service.generateSummary(MESSAGES)).resolves.toBe('Hi, I would like detailed recipe suggestions.')
    expect(judgeCallCount()).toBe(1)
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

    await expect(service.chat(MESSAGES)).resolves.toBe(BUDGET_EXCEEDED_MESSAGE)
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

  it('throws 503 for summary when the budget is exceeded (frontend falls back to wa.me)', async () => {
    const { service, call } = makeService('unused summary')
    withRedis(service, 1001)

    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
    expect(call).not.toHaveBeenCalled()
  })
})
