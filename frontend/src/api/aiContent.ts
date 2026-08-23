import { API } from './config'
import type {
  AiCampaign,
  AiCampaignStats,
  AiContentStatus,
  AiGenerationJob,
  AiJobStatus,
  AiJobTrigger,
  BlogPost,
} from '../types'

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

// Every endpoint here is admin-only; a 401 is surfaced with its status so the
// pages can drop the session the same way the rest of the panel does.
async function request<T>(path: string, options: RequestInit, fallback: string): Promise<T> {
  const res = await fetch(`${API}/api/ai-content${path}`, options)
  if (res.status === 204) return undefined as T
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw apiError(res, (json as { message?: string }).message || fallback)
  return json as T
}

export function fetchAiStatus(): Promise<AiContentStatus> {
  return request('/status', authOptions(), 'Could not load the AI generation status')
}

export function fetchAiCampaigns(): Promise<AiCampaign[]> {
  return request('/campaigns', authOptions(), 'Could not load campaigns')
}

export function fetchAiCampaign(id: string): Promise<AiCampaign> {
  return request(`/campaigns/${id}`, authOptions(), 'Could not load the campaign')
}

export function createAiCampaign(data: Partial<AiCampaign>): Promise<AiCampaign> {
  return request(
    '/campaigns',
    { ...authOptions({ method: 'POST' }), body: JSON.stringify(data) },
    'Could not create the campaign',
  )
}

export function updateAiCampaign(id: string, data: Partial<AiCampaign>): Promise<AiCampaign> {
  return request(
    `/campaigns/${id}`,
    { ...authOptions({ method: 'PATCH' }), body: JSON.stringify(data) },
    'Could not update the campaign',
  )
}

export function deleteAiCampaign(id: string): Promise<void> {
  return request(`/campaigns/${id}`, authOptions({ method: 'DELETE' }), 'Could not archive the campaign')
}

export function setAiCampaignState(id: string, action: 'activate' | 'pause' | 'resume'): Promise<AiCampaign> {
  return request(`/campaigns/${id}/${action}`, authOptions({ method: 'POST' }), `Could not ${action} the campaign`)
}

export function fetchAiCampaignStats(id: string): Promise<AiCampaignStats> {
  return request(`/campaigns/${id}/stats`, authOptions(), 'Could not load campaign statistics')
}

export function fetchAiCampaignDrafts(id: string): Promise<BlogPost[]> {
  return request(`/campaigns/${id}/drafts`, authOptions(), 'Could not load the generated drafts')
}

// One draft outside the rotation: does not move the daily counter.
export function generateAiTestDraft(id: string): Promise<{ job: AiGenerationJob }> {
  return request(`/campaigns/${id}/test`, authOptions({ method: 'POST' }), 'Could not start the test generation')
}

// Pulls the next scheduled article forward; counts against today's target.
export function generateAiNext(id: string): Promise<{ job: AiGenerationJob }> {
  return request(
    `/campaigns/${id}/generate-now`,
    authOptions({ method: 'POST' }),
    'Could not start the generation',
  )
}

export interface AiJobFilters {
  campaignId?: string
  status?: AiJobStatus
  triggerType?: AiJobTrigger
  page?: number
  from?: string
  to?: string
}

export function fetchAiJobs(
  { campaignId, status, triggerType, page = 1, from, to }: AiJobFilters = {},
): Promise<{ jobs: AiGenerationJob[]; page: number; pageCount: number; total: number }> {
  const params = new URLSearchParams({ page: String(page) })
  if (campaignId) params.set('campaignId', campaignId)
  if (status) params.set('status', status)
  if (triggerType) params.set('triggerType', triggerType)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return request(`/jobs?${params}`, authOptions(), 'Could not load generation logs')
}

export function retryAiJob(id: string): Promise<AiGenerationJob> {
  return request(`/jobs/${id}/retry`, authOptions({ method: 'POST' }), 'Could not retry the job')
}
