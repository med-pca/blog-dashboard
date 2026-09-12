import { API } from './config'

// Mirrors backend/src/ai/providers/registry.ts. The backend is the source of
// truth — this list only types the response and orders the picker.
export const AI_VENDORS = ['openai', 'gemini', 'qwen', 'deepseek', 'groq'] as const

export type AiVendorName = (typeof AI_VENDORS)[number]

export interface AiVendorView {
  name: AiVendorName
  label: string
  note: string
  defaultModel: string
  baseUrl: string | null
  strictJson: boolean
  // Whether the vendor's key is present in the backend environment. The key
  // itself is never sent to the browser.
  keyConfigured: boolean
}

export interface AiSettingsView {
  provider: AiVendorName
  // '' means "use the vendor default".
  model: string
  // Set when the chosen vendor has no key and the backend is falling back.
  fallbackReason: string | null
  effectiveProvider: AiVendorName
  effectiveModel: string
  vendors: AiVendorView[]
}

function authOptions(extra: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...extra,
  }
}

function apiError(res: Response, message: string): Error {
  return Object.assign(new Error(message), { status: res.status })
}

export async function fetchAiSettings(): Promise<AiSettingsView> {
  const res = await fetch(`${API}/api/ai/settings`, authOptions({ cache: 'no-store' }))
  if (!res.ok) throw apiError(res, 'Could not load the AI provider settings')
  return res.json()
}

export async function saveAiSettings(patch: { provider: AiVendorName; model: string }): Promise<AiSettingsView> {
  const res = await fetch(`${API}/api/ai/settings`, authOptions({
    method: 'PATCH',
    body: JSON.stringify(patch),
  }))
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = Array.isArray(json.message) ? json.message.join(' · ') : json.message
    throw apiError(res, message || 'Could not save the AI provider settings')
  }
  return json
}
