// The SDK is mocked module-wide: no test in this repo may reach api.openai.com.
const createMock = jest.fn()
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ responses: { create: createMock } })),
}))

import OpenAI from 'openai'
import { ConfigService } from '@nestjs/config'
import { AiConfig } from '../ai.config'
import { OpenAiClient } from '../openai.client'
import { AiGenerationError } from '../errors'

const TEST_KEY = 'sk-proj-TESTKEY000011112222333344445555'

function makeClient(env: Record<string, string> = {}): OpenAiClient {
  const values: Record<string, string> = { OPENAI_API_KEY: TEST_KEY, OPENAI_MODEL: 'gpt-5-nano', ...env }
  const config = new ConfigService()
  jest.spyOn(config, 'get').mockImplementation(((key: string) => values[key]) as never)
  return new OpenAiClient(new AiConfig(config))
}

function completed(payload: unknown) {
  return {
    status: 'completed',
    output_text: typeof payload === 'string' ? payload : JSON.stringify(payload),
    usage: { input_tokens: 10, output_tokens: 20 },
  }
}

const JSON_REQUEST = {
  operation: 'test-op',
  model: 'gpt-5-nano',
  timeoutMs: 5000,
  maxOutputTokens: 500,
  instructions: 'rules',
  input: 'data',
  schemaName: 'thing',
  schema: { type: 'object', additionalProperties: false, required: ['a'], properties: { a: { type: 'string' } } },
}

// A rejection shaped like an SDK HTTP error; classifyFailure is duck-typed on `status`.
function httpError(status: number, message = 'upstream said no') {
  return Object.assign(new Error(message), { status })
}

describe('OpenAiClient', () => {
  beforeEach(() => {
    createMock.mockReset()
    ;(OpenAI as unknown as jest.Mock).mockClear()
  })

  it('sends a strict json_schema request through the Responses API', async () => {
    createMock.mockResolvedValue(completed({ a: 'x' }))
    const result = await makeClient().respondJson<{ a: string }>({ ...JSON_REQUEST, retries: 0 })

    const [body, options] = createMock.mock.calls[0]
    expect(body.text.format).toMatchObject({ type: 'json_schema', name: 'thing', strict: true })
    expect(options.timeout).toBe(5000)
    expect(result.value).toEqual({ a: 'x' })
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 20 })
  })

  it('gives reasoning models thinking head room above the prose budget', async () => {
    createMock.mockResolvedValue(completed({ a: 'x' }))
    await makeClient().respondJson({ ...JSON_REQUEST, retries: 0 })
    expect(createMock.mock.calls[0][0].max_output_tokens).toBeGreaterThan(500)
    expect(createMock.mock.calls[0][0].reasoning).toEqual({ effort: 'low' })

    createMock.mockClear()
    await makeClient().respondJson({ ...JSON_REQUEST, model: 'gpt-4o-mini', retries: 0 })
    // A non-reasoning model spends nothing on thinking, so it gets exactly what was asked.
    expect(createMock.mock.calls[0][0].max_output_tokens).toBe(500)
    expect(createMock.mock.calls[0][0].reasoning).toBeUndefined()
  })

  it('retries transient failures with backoff and succeeds on a later attempt', async () => {
    createMock
      .mockRejectedValueOnce(httpError(429))
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValue(completed({ a: 'x' }))

    const result = await makeClient({ OPENAI_MAX_RETRIES: '3' }).respondJson<{ a: string }>(JSON_REQUEST)

    expect(result.value).toEqual({ a: 'x' })
    expect(createMock).toHaveBeenCalledTimes(3)
  }, 15000)

  it('gives up after the configured number of retries', async () => {
    createMock.mockRejectedValue(httpError(500))
    await expect(makeClient({ OPENAI_MAX_RETRIES: '1' }).respondJson(JSON_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
    })
    // 1 retry = 2 attempts in total
    expect(createMock).toHaveBeenCalledTimes(2)
  }, 15000)

  it('never retries a permanent failure — a bad key would just fail again', async () => {
    createMock.mockRejectedValue(httpError(401, 'Incorrect API key provided'))
    await expect(makeClient({ OPENAI_MAX_RETRIES: '3' }).respondJson(JSON_REQUEST)).rejects.toMatchObject({
      kind: 'permanent',
      code: 'AUTH_REJECTED',
    })
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('fails without touching the SDK when no key is configured', async () => {
    await expect(makeClient({ OPENAI_API_KEY: '' }).respondJson(JSON_REQUEST)).rejects.toMatchObject({
      code: 'MISSING_API_KEY',
    })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects output that is not a JSON object', async () => {
    createMock.mockResolvedValue(completed('not json'))
    await expect(makeClient().respondJson({ ...JSON_REQUEST, retries: 0 })).rejects.toMatchObject({
      code: 'INVALID_JSON',
      kind: 'permanent',
    })
  })

  it('keeps the API key out of the error that reaches the caller', async () => {
    // Worst case: the vendor echoes the configured key back in its error body.
    createMock.mockRejectedValue(httpError(400, `Invalid request for key ${TEST_KEY}`))
    const error = (await makeClient()
      .respondJson(JSON_REQUEST)
      .catch((e: unknown) => e)) as AiGenerationError

    expect(error).toBeInstanceOf(AiGenerationError)
    expect(error.message).not.toContain(TEST_KEY)
    expect(error.message).toContain('[REDACTED]')
  })

  it('leaves retries to the caller when asked for none', async () => {
    createMock.mockRejectedValue(httpError(429))
    await expect(makeClient().respondJson({ ...JSON_REQUEST, retries: 0 })).rejects.toMatchObject({ kind: 'transient' })
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('lets the SDK do no retrying of its own', async () => {
    createMock.mockResolvedValue(completed({ a: 'x' }))
    await makeClient().respondJson({ ...JSON_REQUEST, retries: 0 })
    expect((OpenAI as unknown as jest.Mock).mock.calls[0][0]).toMatchObject({ maxRetries: 0 })
  })

  it('passes the turn history through for free-form text generation', async () => {
    createMock.mockResolvedValue(completed('plain answer'))
    const text = await makeClient().respondText({
      operation: 'chat',
      model: 'gpt-5-nano',
      timeoutMs: 5000,
      maxOutputTokens: 100,
      instructions: 'be brief',
      input: [{ role: 'user', content: 'hi' }],
      retries: 0,
    })
    expect(text).toBe('plain answer')
    // No schema on this path: the vendor is not asked for JSON.
    expect(createMock.mock.calls[0][0].text).toBeUndefined()
  })
})
