import type { AiCampaignStatus } from '../entities/ai-content-campaign.entity'
import type { WindowFeasibility } from '../lib/schedule'

// Token counts as reported by the provider for a single call.
export interface AiUsage {
  inputTokens: number
  outputTokens: number
}

export interface TopicRequest {
  masterPrompt: string
  language: string
  keywords: string[]
  count: number
  // Existing titles the model must not re-propose (already trimmed for prompt size).
  avoidTitles: string[]
  // Feedback from a previous round whose candidates were all near-duplicates.
  rejectedTopics: string[]
  model: string
  timeoutMs: number
}

export interface ArticleRequest {
  masterPrompt: string
  topic: string
  language: string
  tone: string
  keywords: string[]
  targetWords: number
  avoidTitles: string[]
  model: string
  timeoutMs: number
}

// Exactly the strict JSON Schema the provider is asked to return.
export interface GeneratedArticle {
  title: string
  slug: string
  excerpt: string
  metaDescription: string
  content: string
  suggestedKeywords: string[]
}

export interface TopicResult {
  topics: string[]
  usage: AiUsage
}

export interface ArticleResult {
  article: GeneratedArticle
  usage: AiUsage
}

// The one seam another provider would implement. Everything above this line is
// provider-agnostic; only providers/openai.provider.ts talks to OpenAI.
export interface AiContentProvider {
  suggestTopics(request: TopicRequest): Promise<TopicResult>
  writeArticle(request: ArticleRequest): Promise<ArticleResult>
}

export const AI_CONTENT_PROVIDER = 'AI_CONTENT_PROVIDER'

export interface CampaignStats {
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
  schedule: WindowFeasibility
  // Populated when the feature flag or the API key blocks generation.
  unavailableReason: string | null
}
