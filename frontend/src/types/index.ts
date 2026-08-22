export type MediaType = 'image' | 'video' | 'thumbnail'

export interface ProjectMedia {
  id: string
  type: MediaType
  src: string
  sortOrder: number
}

export interface StatBox {
  value: string
  label: string
}

export interface Project {
  id: string
  slug: string
  name: string
  location: string
  kw: number
  date: string
  description: string
  about: string
  specs: string[]
  highlights: string[]
  statBoxes: StatBox[]
  category: string | null
  published: boolean
  instagramMediaId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  media: ProjectMedia[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage: string | null
  published: boolean
  // Collection (Project) the post belongs to; null when unassigned.
  collectionId?: string | null
  // Set by the AI content pipeline; drives the "AI Draft" badge.
  aiGenerated?: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── AI content campaigns ────────────────────────────────────
export type AiCampaignStatus = 'active' | 'paused' | 'completed'
export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
export type AiJobTrigger = 'scheduled' | 'manual' | 'retry' | 'test'

export interface AiCampaign {
  id: string
  name: string
  masterPrompt: string
  language: string
  tone: string
  targetWords: number
  keywords: string[]
  dailyTarget: number
  intervalMinutes: number
  generationStartHour: number
  generationEndHour: number
  timezone: string
  enabled: boolean
  status: AiCampaignStatus
  generatedToday: number
  generatedTodayDate: string | null
  lastGenerationAt: string | null
  nextGenerationAt: string | null
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
  // Only present on the list endpoint.
  queued?: number
  running?: number
}

export interface AiGenerationJob {
  id: string
  campaignId: string
  campaign?: { id: string; name: string }
  queueJobId: string
  plannedFor: string
  topic: string | null
  status: AiJobStatus
  triggerType: AiJobTrigger
  attempt: number
  maxAttempts: number
  blogPostId: string | null
  model: string
  inputTokens: number | null
  outputTokens: number | null
  estimatedCost: number | null
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface AiCampaignStats {
  campaignId: string
  status: AiCampaignStatus
  enabled: boolean
  dailyTarget: number
  generatedToday: number
  remainingToday: number
  queued: number
  running: number
  failed24h: number
  succeeded24h: number
  totalDrafts: number
  nextGenerationAt: string | null
  lastGenerationAt: string | null
  lastRunAt: string | null
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  schedule: {
    requiredMinutes: number
    availableMinutes: number
    fits: boolean
    lastStartLabel: string
    maxArticlesInWindow: number
    suggestedIntervalMinutes: number
  }
  unavailableReason: string | null
}

export interface AiContentStatus {
  enabled: boolean
  model: string
  dailyMaxPerCampaign: number
  defaultIntervalMinutes: number
  workerConcurrency: number
  unavailableReason: string | null
}

export interface Reference {
  id: string
  name: string
  logo: string | null
  sortOrder: number
  createdAt: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  sortOrder: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRating {
  id: string
  rating: number
  messageCount: number
  conversation: ChatMessage[] | null
  createdAt: string
}

export interface ChatRatingStats {
  total: number
  average: number
  counts: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface ChatLead {
  id: string
  sessionId: string
  conversation: ChatMessage[] | null
  messageCount: number
  status: 'active' | 'whatsapp'
  rating: number | null
  createdAt: string
  updatedAt: string
}

export interface ChatLeadStats {
  total: number
  active: number
  whatsapp: number
}

export interface ChatFunnel {
  days: number
  opened: number
  messaged: number
  whatsapp: number
  rated: number
}

export interface AppLog {
  id: string
  level: 'error' | 'warn'
  context: string | null
  message: string
  createdAt: string
}

export interface LogStats {
  total: number
  errors24h: number
  warns24h: number
}

export interface SyncStatus {
  running: boolean
  lastRun: string | null
  lastResult: { imported: number; skipped: number } | null
  lastError: string | null
}

export type QuoteServiceType = 'cati-ges' | 'tarimsal-sulama' | 'ev-sarj' | 'diger'
export type QuoteStatus = 'new' | 'contacted' | 'won' | 'lost'

export interface QuoteRequest {
  id: string
  name: string | null
  phone: string | null
  city: string | null
  serviceType: QuoteServiceType
  monthlyBill: number | null
  message: string | null
  kvkkConsent: boolean
  consentAt: string
  status: QuoteStatus
  createdAt: string
  updatedAt: string
}

export interface QuoteStats {
  total: number
  new: number
  contacted: number
  won: number
  lost: number
}
