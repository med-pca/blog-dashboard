// The SDK is mocked module-wide: no test in this repo may reach api.openai.com.
const createMock = jest.fn()
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ responses: { create: createMock } })),
}))

import OpenAI from 'openai'
import { isReasoningModel } from '../providers/openai.provider'
import { makeArticle, makeProvider } from './helpers'

function respondWith(payload: unknown, extra: Record<string, unknown> = {}) {
  createMock.mockResolvedValue({
    status: 'completed',
    output_text: typeof payload === 'string' ? payload : JSON.stringify(payload),
    usage: { input_tokens: 800, output_tokens: 2400 },
    ...extra,
  })
}

const ARTICLE_REQUEST = {
  masterPrompt: 'Simple family recipes.',
  topic: 'Sheet Pan Honey Garlic Chicken',
  language: 'English',
  tone: 'friendly',
  keywords: ['weeknight'],
  targetWords: 1200,
  avoidTitles: ['No Knead Sourdough'],
  model: 'gpt-5-nano',
  timeoutMs: 30_000,
}

describe('OpenAiContentProvider', () => {
  beforeEach(() => {
    createMock.mockReset()
    ;(OpenAI as unknown as jest.Mock).mockClear()
  })

  it('asks for the article with a strict JSON schema and returns the token usage', async () => {
    respondWith(makeArticle())
    const provider = makeProvider()

    const result = await provider.writeArticle(ARTICLE_REQUEST)

    const [body, options] = createMock.mock.calls[0]
    expect(body.model).toBe('gpt-5-nano')
    expect(body.text.format).toMatchObject({ type: 'json_schema', name: 'blog_article', strict: true })
    expect(body.text.format.schema.additionalProperties).toBe(false)
    expect(options.timeout).toBe(30_000)
    expect(result.usage).toEqual({ inputTokens: 800, outputTokens: 2400 })
    expect(result.article.title).toBe('Sheet Pan Honey Garlic Chicken')
  })

  it('never lets the schema describe a publication flag', async () => {
    respondWith(makeArticle())
    await makeProvider().writeArticle(ARTICLE_REQUEST)
    const schema = createMock.mock.calls[0][0].text.format.schema
    expect(Object.keys(schema.properties)).not.toContain('published')
    expect(schema.required).toEqual(['title', 'slug', 'excerpt', 'metaDescription', 'content', 'suggestedKeywords'])
  })

  it('carries the editorial guardrails and the avoid-list into the prompt', async () => {
    respondWith(makeArticle())
    await makeProvider().writeArticle(ARTICLE_REQUEST)
    const { instructions, input } = createMock.mock.calls[0][0]
    expect(instructions).toContain('Never invent statistics')
    expect(instructions).toContain('Never mention that the text was produced by an AI')
    expect(input).toContain('Sheet Pan Honey Garlic Chicken')
    expect(input).toContain('No Knead Sourdough')
  })

  it('turns unparsable output into a permanent failure', async () => {
    respondWith('not json at all')
    await expect(makeProvider().writeArticle(ARTICLE_REQUEST)).rejects.toMatchObject({
      kind: 'permanent',
      code: 'INVALID_JSON',
    })
  })

  it('turns an empty reply into a permanent failure', async () => {
    createMock.mockResolvedValue({ status: 'completed', output_text: '   ', usage: null })
    await expect(makeProvider().writeArticle(ARTICLE_REQUEST)).rejects.toMatchObject({
      code: 'EMPTY_RESPONSE',
    })
  })

  it('treats a token-ceiling cut-off as retryable and a content filter as final', async () => {
    createMock.mockResolvedValue({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      usage: { input_tokens: 10, output_tokens: 10 },
    })
    await expect(makeProvider().writeArticle(ARTICLE_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      code: 'OUTPUT_TRUNCATED',
    })

    createMock.mockResolvedValue({
      status: 'incomplete',
      incomplete_details: { reason: 'content_filter' },
      usage: { input_tokens: 10, output_tokens: 10 },
    })
    await expect(makeProvider().writeArticle(ARTICLE_REQUEST)).rejects.toMatchObject({
      kind: 'permanent',
      code: 'RESPONSE_INCOMPLETE',
    })
  })

  it('fails clearly and without calling the SDK when the key is missing', async () => {
    const provider = makeProvider({ OPENAI_API_KEY: '' })
    await expect(provider.writeArticle(ARTICLE_REQUEST)).rejects.toMatchObject({ code: 'MISSING_API_KEY' })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('leaves retries to BullMQ rather than retrying inside the SDK', async () => {
    respondWith(makeArticle())
    await makeProvider().writeArticle(ARTICLE_REQUEST)
    expect((OpenAI as unknown as jest.Mock).mock.calls[0][0]).toMatchObject({ maxRetries: 0 })
  })

  it('returns trimmed, non-empty topic candidates', async () => {
    respondWith({ topics: ['  First idea  ', '', 'Second idea', 42] })
    const result = await makeProvider().suggestTopics({
      masterPrompt: 'Simple family recipes.',
      language: 'English',
      keywords: [],
      count: 6,
      avoidTitles: ['Existing Post'],
      rejectedTopics: ['Rejected Idea'],
      model: 'gpt-5-nano',
      timeoutMs: 30_000,
    })
    expect(result.topics).toEqual(['First idea', 'Second idea'])
    expect(createMock.mock.calls[0][0].input).toContain('Rejected Idea')
  })
})

describe('isReasoningModel', () => {
  it('sends the reasoning budget only to models that bill for it', () => {
    expect(isReasoningModel('gpt-5-nano')).toBe(true)
    expect(isReasoningModel('o3-mini')).toBe(true)
    expect(isReasoningModel('gpt-4o-mini')).toBe(false)
  })
})
