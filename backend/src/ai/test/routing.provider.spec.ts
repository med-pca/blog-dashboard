import { Logger } from '@nestjs/common'
import { AiRoutingProvider } from '../providers/routing.provider'
import type { AiConfig } from '../ai.config'
import type { AiSettingsService } from '../ai-settings.service'
import type { ChatCompletionsClient } from '../chat-completions.client'
import type { OpenAiProvider } from '../providers/openai.provider'
import type { GroqProvider } from '../providers/groq.provider'
import type { ResolvedVendor } from '../ai-settings.types'

// The router is the piece that makes the admin choice real at call time. These
// specs assert where a call lands, not what any vendor does with it.

function makeRouter(route: ResolvedVendor) {
  type Req = Record<string, unknown>
  const openai = {
    generateJson: jest.fn(async (_r: Req) => ({ value: { ok: true }, usage: { inputTokens: 1, outputTokens: 2 } })),
    generateText: jest.fn(async (_r: Req) => 'openai'),
  }
  const groq = {
    generateJson: jest.fn(async (_r: Req) => ({ value: { ok: true }, usage: { inputTokens: 0, outputTokens: 0 } })),
    generateText: jest.fn(async (_r: Req) => 'groq'),
  }
  const chat = {
    respondJson: jest.fn(async (_r: Req) => ({ value: { ok: true }, usage: { inputTokens: 3, outputTokens: 4 } })),
    respondText: jest.fn(async (_r: Req) => 'chat'),
  }
  const settings = { resolve: jest.fn(async () => route) }
  const config = { timeoutMs: 120_000 }

  const router = new AiRoutingProvider(
    settings as unknown as AiSettingsService,
    config as unknown as AiConfig,
    openai as unknown as OpenAiProvider,
    groq as unknown as GroqProvider,
    chat as unknown as ChatCompletionsClient,
  )
  // The fallback warning is deliberate behaviour, not test noise.
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
  return { router, openai, groq, chat, settings }
}

const JSON_REQUEST = {
  operation: 'test',
  instructions: 'be brief',
  maxOutputTokens: 100,
  input: 'user text',
  schemaName: 'thing',
  schema: { type: 'object' } as Record<string, unknown>,
}

const TEXT_REQUEST = {
  operation: 'test',
  instructions: 'be brief',
  maxOutputTokens: 100,
  messages: [{ role: 'user' as const, content: 'hello' }],
}

describe('AiRoutingProvider dispatch', () => {
  it('sends an OpenAI route through the Responses adapter', async () => {
    const { router, openai, chat } = makeRouter({ provider: 'openai', model: 'gpt-5-nano', fallbackReason: null })
    await router.generateJson(JSON_REQUEST)
    expect(openai.generateJson).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-5-nano' }))
    expect(chat.respondJson).not.toHaveBeenCalled()
  })

  it('sends every other vendor through the chat-completions client', async () => {
    const { router, openai, chat } = makeRouter({ provider: 'qwen', model: 'qwen3.8-flash', fallbackReason: null })
    await router.generateJson(JSON_REQUEST)
    expect(openai.generateJson).not.toHaveBeenCalled()
    expect(chat.respondJson).toHaveBeenCalledWith(
      expect.objectContaining({ vendor: 'qwen', model: 'qwen3.8-flash', schemaName: 'thing' }),
    )
  })

  it('keeps the legacy Groq adapter reachable', async () => {
    const { router, groq, chat } = makeRouter({ provider: 'groq', model: '', fallbackReason: null })
    expect(await router.generateText(TEXT_REQUEST)).toBe('groq')
    expect(groq.generateText).toHaveBeenCalled()
    expect(chat.respondText).not.toHaveBeenCalled()
  })

  // User-supplied text must never reach the system message, on any transport.
  it('carries the caller input as a user turn, not as instructions', async () => {
    const { router, chat } = makeRouter({ provider: 'gemini', model: 'gemini-3.6-flash', fallbackReason: null })
    await router.generateJson(JSON_REQUEST)
    const sent = chat.respondJson.mock.calls[0][0] as unknown as { instructions: string; messages: { role: string; content: string }[] }

    expect(sent.instructions).toBe('be brief')
    expect(sent.messages).toEqual([{ role: 'user', content: 'user text' }])
  })

  // ai-content resolves the active model once per job and pins it on both
  // calls, so the cost line it records names what actually ran.
  it('lets a caller-pinned model win over the resolved one', async () => {
    const { router, chat } = makeRouter({ provider: 'qwen', model: 'qwen3.8-flash', fallbackReason: null })
    await router.generateJson({ ...JSON_REQUEST, model: 'deepseek-v4-pro-0813' })
    expect(chat.respondJson).toHaveBeenCalledWith(expect.objectContaining({ model: 'deepseek-v4-pro-0813' }))
  })

  it('routes to the fallback vendor the settings service resolved', async () => {
    const { router, openai, chat } = makeRouter({
      provider: 'openai',
      model: 'gpt-5-nano',
      fallbackReason: 'deepseek selected but DEEPSEEK_API_KEY is not set — using openai',
    })
    await router.generateText(TEXT_REQUEST)
    expect(openai.generateText).toHaveBeenCalled()
    expect(chat.respondText).not.toHaveBeenCalled()
  })

  it('re-reads the choice on every call, so a panel change needs no restart', async () => {
    const { router, settings } = makeRouter({ provider: 'openai', model: 'gpt-5-nano', fallbackReason: null })
    await router.generateJson(JSON_REQUEST)
    await router.generateText(TEXT_REQUEST)
    expect(settings.resolve).toHaveBeenCalledTimes(2)
  })
})
