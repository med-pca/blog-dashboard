import { API } from './config'

const TIMEOUT_MS = 20000

export interface QuoteFormData {
  name: string
  email: string
  message?: string
  kvkkConsent: boolean
  website?: string
}

export async function submitQuoteRequest(data: QuoteFormData): Promise<{ id: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
    if (res.status === 429) {
      throw Object.assign(new Error('Too many attempts. Please try again in a few minutes.'), { status: 429 })
    }
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = Array.isArray(json.message) ? json.message[0] : json.message
      throw new Error(message || 'Your message could not be sent')
    }
    return json
  } finally {
    clearTimeout(timer)
  }
}
