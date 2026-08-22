import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, MoreThan, Not, Repository } from 'typeorm'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { AiContentCampaign } from './entities/ai-content-campaign.entity'
import { AiGenerationJob } from './entities/ai-generation-job.entity'
import { AiPermanentError } from './lib/errors'
import { findDuplicate, normalizeTopic, slugToWords } from './lib/text'
import { AI_CONTENT_PROVIDER, type AiContentProvider, type AiUsage } from './types/ai-content.types'

// How many titles are sent to the model as an explicit avoid-list. The full
// corpus is still compared locally; this only bounds the prompt.
const AVOID_LIST_SIZE = 40
// Candidates asked for per round, and how many rounds before giving up.
const CANDIDATES_PER_ROUND = 6
const MAX_ROUNDS = 3
// Failed jobs older than this stop reserving their topic.
const FAILED_TOPIC_COOLDOWN_MS = 24 * 60 * 60 * 1000

export interface PickedTopic {
  topic: string
  normalizedTopic: string
  usage: AiUsage
  // Titles handed to the writer so the article itself avoids overlap.
  avoidTitles: string[]
}

@Injectable()
export class AiTopicService {
  private readonly logger = new Logger(AiTopicService.name)

  constructor(
    @InjectRepository(BlogPost) private readonly posts: Repository<BlogPost>,
    @InjectRepository(AiGenerationJob) private readonly jobs: Repository<AiGenerationJob>,
    @Inject(AI_CONTENT_PROVIDER) private readonly provider: AiContentProvider,
  ) {}

  // Everything a new topic must not collide with: published and draft posts,
  // their slugs, in-flight and succeeded jobs, plus recent failures so a topic
  // that just blew up is not retried immediately.
  async collectTaken(campaignId: string, excludeJobId?: string): Promise<{ normalized: Set<string>; titles: string[] }> {
    const [posts, activeJobs, recentFailures] = await Promise.all([
      this.posts.find({ select: ['title', 'slug', 'createdAt'], order: { createdAt: 'DESC' }, take: 2000 }),
      this.jobs.find({
        where: { status: In(['queued', 'running', 'succeeded']), ...(excludeJobId ? { id: Not(excludeJobId) } : {}) },
        select: ['topic', 'normalizedTopic', 'campaignId'],
        order: { createdAt: 'DESC' },
        take: 2000,
      }),
      this.jobs.find({
        where: {
          status: In(['failed']),
          campaignId,
          createdAt: MoreThan(new Date(Date.now() - FAILED_TOPIC_COOLDOWN_MS)),
          ...(excludeJobId ? { id: Not(excludeJobId) } : {}),
        },
        select: ['topic', 'normalizedTopic'],
        take: 500,
      }),
    ])

    const normalized = new Set<string>()
    const titles: string[] = []

    for (const post of posts) {
      const asTitle = normalizeTopic(post.title ?? '')
      if (asTitle) {
        normalized.add(asTitle)
        titles.push(post.title)
      }
      const asSlug = slugToWords(post.slug ?? '')
      if (asSlug) normalized.add(asSlug)
    }

    for (const job of [...activeJobs, ...recentFailures]) {
      const key = job.normalizedTopic || normalizeTopic(job.topic ?? '')
      if (key) normalized.add(key)
      if (job.topic) titles.push(job.topic)
    }

    return { normalized, titles }
  }

  // Asks the provider for candidates, keeps the first that is not a near
  // duplicate, and gives the model the rejects as feedback on the next round.
  async pickTopic(
    campaign: AiContentCampaign,
    options: { model: string; timeoutMs: number; excludeJobId?: string },
  ): Promise<PickedTopic> {
    const { normalized, titles } = await this.collectTaken(campaign.id, options.excludeJobId)
    const avoidTitles = titles.slice(0, AVOID_LIST_SIZE)
    const usage: AiUsage = { inputTokens: 0, outputTokens: 0 }
    const rejected: string[] = []

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const result = await this.provider.suggestTopics({
        masterPrompt: campaign.masterPrompt,
        language: campaign.language,
        keywords: campaign.keywords ?? [],
        count: CANDIDATES_PER_ROUND,
        avoidTitles,
        rejectedTopics: rejected.slice(-CANDIDATES_PER_ROUND),
        model: options.model,
        timeoutMs: options.timeoutMs,
      })
      usage.inputTokens += result.usage.inputTokens
      usage.outputTokens += result.usage.outputTokens

      for (const candidate of result.topics) {
        const trimmed = candidate.trim().slice(0, 280)
        const key = normalizeTopic(trimmed)
        if (!key) continue
        const verdict = findDuplicate(trimmed, normalized)
        if (verdict.duplicate) {
          rejected.push(trimmed)
          continue
        }
        // Guard against the same round proposing two variants of one idea.
        normalized.add(key)
        return { topic: trimmed, normalizedTopic: key, usage, avoidTitles }
      }

      this.logger.warn(
        `Campaign ${campaign.id}: round ${round + 1} produced only near-duplicate topics (${result.topics.length} candidates)`,
      )
    }

    throw new AiPermanentError(
      'TOPIC_EXHAUSTED',
      `No original topic found after ${MAX_ROUNDS} rounds; broaden the campaign prompt or its keywords`,
    )
  }

  // Second gate: the writer may drift from the topic it was handed, so the
  // finished title is checked again before a draft is created.
  async assertTitleIsOriginal(title: string, campaignId: string, excludeJobId?: string): Promise<void> {
    const { normalized } = await this.collectTaken(campaignId, excludeJobId)
    const verdict = findDuplicate(title, normalized)
    if (verdict.duplicate) {
      throw new AiPermanentError(
        'DUPLICATE_TITLE',
        `Generated title is too close to an existing article (score ${verdict.score?.toFixed(2) ?? '1.00'})`,
      )
    }
  }
}
