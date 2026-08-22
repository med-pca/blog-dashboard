import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseInstagramPost } from '../admin'

// Contract of the auto-fill call as the admin form depends on it:
//  - it goes to OUR backend, never to a model vendor;
//  - a failure surfaces a neutral English sentence, never "Groq" and never a
//    bare HTTP status, so the form can show it as-is;
//  - a failure throws, which is what lets ProjeForm keep the typed values.

function mockResponse(ok, status, body) {
  return { ok, status, json: () => Promise.resolve(body) }
}

describe('parseInstagramPost', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('posts to the backend auto-fill endpoint with credentials', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse(true, 200, { name: 'Weeknight Dinners' }))

    await parseInstagramPost('Weeknight Dinners')

    const [url, options] = globalThis.fetch.mock.calls[0]
    expect(url).toContain('/api/projects/admin/parse-instagram')
    expect(url).not.toContain('openai.com')
    expect(url).not.toContain('groq.com')
    expect(options.method).toBe('POST')
    // The JWT travels in the cookie; no key is ever sent from the browser.
    expect(options.credentials).toBe('include')
    expect(JSON.stringify(options)).not.toMatch(/sk-|Authorization/i)
  })

  it('sends the optional instruction only when one was given', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse(true, 200, {}))

    await parseInstagramPost('Weeknight Dinners')
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body)).toEqual({ text: 'Weeknight Dinners' })

    await parseInstagramPost('Weeknight Dinners', 'focus on batch cooking')
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({
      text: 'Weeknight Dinners',
      instruction: 'focus on batch cooking',
    })
  })

  it('returns the parsed fields untouched on success', async () => {
    const parsed = { name: '10,2 kW Hibrit GES Sistemi', location: 'Manisa', kw: 10.2, specs: ['28 Adet Panel'] }
    globalThis.fetch.mockResolvedValue(mockResponse(true, 200, parsed))

    await expect(parseInstagramPost('caption')).resolves.toEqual(parsed)
  })

  it('surfaces the neutral backend message on failure', async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse(false, 503, { message: 'AI generation is temporarily unavailable. Please try again.' }),
    )

    await expect(parseInstagramPost('caption')).rejects.toThrow(
      'AI generation is temporarily unavailable. Please try again.',
    )
  })

  it('never lets a vendor name or a bare status reach the admin', async () => {
    const leaky = [
      [500, { message: 'Groq API hatasi: 401' }],
      [502, { message: '502' }],
      [500, {}],
    ]

    for (const [status, body] of leaky) {
      globalThis.fetch.mockResolvedValue(mockResponse(false, status, body))
      const error = await parseInstagramPost('caption').catch(e => e)
      expect(error.message).not.toMatch(/groq/i)
      expect(error.message).not.toMatch(/openai/i)
      expect(error.message).not.toMatch(/^\d{3}$/)
      expect(error.message).toMatch(/please try again|please wait/i)
    }
  })

  it('explains a rate limit in its own words', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse(false, 429, {}))
    await expect(parseInstagramPost('caption')).rejects.toThrow(/Too many auto-fill requests/)
  })
})
