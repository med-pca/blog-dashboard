import { API } from './config'
import type { Project, ProjectMedia, BlogPost, Faq, SyncStatus, ChatRating, ChatRatingStats, ChatLead, ChatLeadStats, ChatFunnel, AppLog, LogStats, QuoteRequest, QuoteStats, QuoteStatus } from '../types'

function authOptions(extra: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...extra,
  }
}

function rateError(): never {
  throw Object.assign(new Error('429'), { status: 429 })
}

function apiError(res: Response, message: string): Error {
  return Object.assign(new Error(message), { status: res.status })
}

export async function login(
  username: string,
  password: string,
  rememberMe = false,
): Promise<{ preAuthToken?: string; requires2fa?: boolean; success?: boolean }> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
  })
  if (res.status === 429) rateError()
  const data = await res.json()
  if (!res.ok) throw apiError(res, data.message || 'Sign-in failed')
  return data
}

export async function verify2FA(
  preAuthToken: string,
  code: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preAuthToken, code }),
  })
  if (res.status === 429) rateError()
  const data = await res.json()
  if (!res.ok) throw apiError(res, data.message || 'Invalid code')
  return data
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
  if (!res.ok) throw apiError(res, 'Sign-out failed')
}

export async function changeCredentials(payload: {
  currentPassword: string
  newUsername?: string
  newPassword?: string
  totpCode?: string
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/credentials`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw apiError(res, data.message || 'Change failed')
  return data
}

export async function get2FAStatus(): Promise<{ enabled: boolean }> {
  const res = await fetch(`${API}/api/auth/2fa/status`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load the status')
  return res.json()
}

export async function generate2FASetup(): Promise<{ secret: string; qrCodeUrl: string }> {
  const res = await fetch(`${API}/api/auth/2fa/setup`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not generate the QR code')
  return res.json()
}

export async function confirm2FASetup(
  secret: string,
  code: string,
  currentCode?: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/setup/confirm`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ secret, code, ...(currentCode ? { currentCode } : {}) }),
  })
  const data = await res.json()
  if (!res.ok) throw apiError(res, data.message || 'Verification failed')
  return data
}

export async function remove2FA(code: string, currentPassword: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/setup`, {
    ...authOptions({ method: 'DELETE' }),
    body: JSON.stringify({ code, currentPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw apiError(res, data.message || 'Could not remove 2FA')
  return data
}

// Projects
export async function fetchAllProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/api/projects/admin/all`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load collections')
  return res.json()
}

export async function syncInstagram(): Promise<{ status: string }> {
  const res = await fetch(`${API}/api/projects/admin/instagram-sync`, authOptions({ method: 'POST' }))
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Sync failed')
  return json
}

// Neutral fallbacks: the backend already answers with a vendor-free message,
// but a proxy or a rate-limit response can arrive without one. The admin must
// never be shown a model vendor name or a bare HTTP status.
const AI_UNAVAILABLE = 'AI generation is temporarily unavailable. Please try again.'
const AI_RATE_LIMITED = 'Too many auto-fill requests. Please wait a moment and try again.'

export async function parseInstagramPost(
  text: string,
  instruction?: string,
): Promise<Partial<Project>> {
  const res = await fetch(`${API}/api/projects/admin/parse-instagram`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(instruction ? { text, instruction } : { text }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    // A message is only trusted when it reads like a sentence for the admin;
    // anything else (a status line, a stack, a vendor error) is replaced.
    const message =
      typeof json.message === 'string' && /[a-z] [a-z]/i.test(json.message) && !/groq|openai/i.test(json.message)
        ? json.message
        : res.status === 429
          ? AI_RATE_LIMITED
          : AI_UNAVAILABLE
    throw apiError(res, message)
  }
  return json
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API}/api/projects`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not create the collection')
  return json
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API}/api/projects/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not update the collection')
  return json
}

export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/projects/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw apiError(res, 'Could not save the order')
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API}/api/projects/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the collection')
}

export async function uploadMedia(projectId: string, files: File[]): Promise<ProjectMedia[]> {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Upload failed')
  return json
}

export async function linkMedia(projectId: string, src: string): Promise<ProjectMedia> {
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media/link`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ src }),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not create the link')
  return json
}

export async function deleteMedia(projectId: string, mediaId: string): Promise<void> {
  const res = await fetch(`${API}/api/projects/${projectId}/media/${mediaId}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the media')
}

export async function reorderMedia(projectId: string, orderedIds: string[]): Promise<Project> {
  const res = await fetch(`${API}/api/projects/${projectId}/media/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw apiError(res, 'Could not update the order')
  return res.json()
}

// Blog
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API}/api/blog/admin/all`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load blog posts')
  return res.json()
}

export async function createBlogPost(data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API}/api/blog`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not create the post')
  return json
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API}/api/blog/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not update the post')
  return json
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await fetch(`${API}/api/blog/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the post')
}

export async function reorderBlogPosts(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/blog/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw apiError(res, 'Could not save the order')
}

export async function uploadBlogCover(postId: string, file: File): Promise<BlogPost> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/api/upload/blog/${postId}/cover`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not upload the cover image')
  return json
}

// SSS (FAQ)
export async function fetchAllFaqs(): Promise<Faq[]> {
  const res = await fetch(`${API}/api/faq/admin/all`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load FAQs')
  return res.json()
}

export async function createFaq(data: Partial<Faq>): Promise<Faq> {
  const res = await fetch(`${API}/api/faq`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not create the FAQ')
  return json
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  const res = await fetch(`${API}/api/faq/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not update the FAQ')
  return json
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await fetch(`${API}/api/faq/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'SSS silinemedi')
}

// Chat ratings
export async function fetchChatRatings(
  page = 1,
): Promise<{ stats: ChatRatingStats; ratings: ChatRating[]; page: number; pageCount: number }> {
  const res = await fetch(`${API}/api/chat/rating/admin/all?page=${page}`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load ratings')
  return res.json()
}

// Chat potansiyel talepleri (lead)
export async function fetchChatLeads(
  { page = 1, status, from, to }: { page?: number; status?: 'active' | 'whatsapp'; from?: string; to?: string } = {},
): Promise<{ stats: ChatLeadStats; leads: ChatLead[]; page: number; pageCount: number }> {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await fetch(`${API}/api/chat/lead/admin/all?${params}`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load requests')
  return res.json()
}

// Chatbot conversion funnel (open -> message -> WhatsApp)
export async function fetchChatFunnel(days: 7 | 30): Promise<ChatFunnel> {
  const res = await fetch(`${API}/api/chat/lead/admin/funnel?days=${days}`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load funnel statistics')
  return res.json()
}

export async function deleteChatLead(id: string): Promise<void> {
  const res = await fetch(`${API}/api/chat/lead/admin/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the request')
}

export async function deleteChatRating(id: string): Promise<void> {
  const res = await fetch(`${API}/api/chat/rating/admin/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the rating')
}

export async function reorderFaqs(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/faq/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw apiError(res, 'Could not save the order')
}

// Contact requests (from the "Get A Recipe Plan" form)
export async function fetchQuoteRequests(
  { page = 1, status, from, to }: { page?: number; status?: QuoteStatus; from?: string; to?: string } = {},
): Promise<{ stats: QuoteStats; requests: QuoteRequest[]; page: number; pageCount: number }> {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await fetch(`${API}/api/quote/admin/all?${params}`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load requests')
  return res.json()
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<QuoteRequest> {
  const res = await fetch(`${API}/api/quote/admin/${id}/status`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok) throw apiError(res, json.message || 'Could not update the status')
  return json
}

export async function deleteQuoteRequest(id: string): Promise<void> {
  const res = await fetch(`${API}/api/quote/admin/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw apiError(res, 'Could not delete the request')
}

// Backend error/warning logs (admin panel -> Logs)
export async function fetchLogs(
  { level, page = 1, from, to }: { level?: 'error' | 'warn'; page?: number; from?: string; to?: string } = {},
): Promise<{ stats: LogStats; logs: AppLog[]; page: number; pageCount: number }> {
  const params = new URLSearchParams({ page: String(page) })
  if (level) params.set('level', level)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await fetch(`${API}/api/logs/admin/all?${params}`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load logs')
  return res.json()
}
