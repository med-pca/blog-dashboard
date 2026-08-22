import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, In, Repository } from 'typeorm'
import { BlogService } from '../blog/blog.service'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { sanitizeAiHtml, stripHtml } from '../common/html-sanitize'
import { isUniqueViolation } from '../common/errors'
import { RESERVED_SLUGS } from '../common/reserved-slugs'
import { AiContentConfig } from './ai-content.config'
import { AiContentCampaign } from './entities/ai-content-campaign.entity'
import { AiGenerationJob } from './entities/ai-generation-job.entity'
import { AiTopicService } from './ai-topic.service'
import { classifyFailure, AiGenerationError, AiPermanentError, redactSecrets } from './lib/errors'
import { estimateCost } from './lib/cost'
import { computeNextGenerationAt, localDateKey } from './lib/schedule'
import { countWords, slugifyTopic } from './lib/text'
import { AI_CONTENT_PROVIDER, type AiContentProvider, type GeneratedArticle } from './types/ai-content.types'

// Mirrors the blog DTO so a generated draft can never be rejected on write.
const TITLE_MAX = 255
const SLUG_MAX = 200
const EXCERPT_MAX = 500
const META_MAX = 160
const CONTENT_MAX = 100_000
// Below this the "article" is a stub, not something worth reviewing.
const MIN_WORDS = 150
const SLUG_ATTEMPTS = 25

export interface RunJobOptions {
  jobId: string
  // Last BullMQ attempt: a transient failure here is final, so the campaign's
  // schedule has to be released instead of waiting for another retry.
  isFinalAttempt: boolean
}

@Injectable()
export class AiContentService {
  private readonly logger = new Logger(AiContentService.name)

  constructor(
    @InjectRepository(AiContentCampaign) private readonly campaigns: Repository<AiContentCampaign>,
    @InjectRepository(AiGenerationJob) private readonly jobs: Repository<AiGenerationJob>,
    @InjectRepository(BlogPost) private readonly posts: Repository<BlogPost>,
    @Inject(AI_CONTENT_PROVIDER) private readonly provider: AiContentProvider,
    private readonly topics: AiTopicService,
    private readonly blog: BlogService,
    private readonly config: AiContentConfig,
  ) {}

  // Entry point of the BullMQ worker. Never throws for "already handled"
  // situations, so a job delivered twice cannot produce a second draft.
  async runJob({ jobId, isFinalAttempt }: RunJobOptions): Promise<void> {
    const claimed = await this.claim(jobId)
    if (!claimed) return

    const job = claimed
    const campaign = await this.campaigns.findOne({ where: { id: job.campaignId } })
    if (!campaign) {
      await this.finishCancelled(job, 'CAMPAIGN_GONE', 'Campaign no longer exists')
      return
    }

    const blocked = this.blockedReason(campaign, job)
    if (blocked) {
      await this.finishCancelled(job, blocked.code, blocked.message)
      await this.rescheduleCampaign(campaign)
      return
    }

    try {
      const post = await this.generateDraft(campaign, job)
      await this.finishSucceeded(job, post.id)
      // Test drafts are explicitly outside the daily rotation.
      if (job.triggerType === 'test') {
        await this.rescheduleCampaign(campaign)
      } else {
        await this.countGeneratedArticle(campaign)
      }
      this.logger.log(`Campaign ${campaign.name}: draft "${post.title}" created (job ${job.id})`)
    } catch (err) {
      const failure = classifyFailure(err, [this.config.apiKey])
      const retriable = failure.kind === 'transient' && !isFinalAttempt

      if (retriable) {
        // Row stays `running`: the campaign is still occupied by this slot.
        await this.jobs.update(job.id, { errorCode: failure.code, errorMessage: failure.message })
        this.logger.warn(`Campaign ${campaign.name}: attempt ${job.attempt} failed (${failure.code}), retrying`)
        throw new AiGenerationError(failure.code, failure.message, failure.kind)
      }

      await this.jobs.update(job.id, {
        status: 'failed',
        errorCode: failure.code,
        errorMessage: failure.message,
        completedAt: new Date(),
      })
      await this.rescheduleCampaign(campaign)
      this.logger.error(`Campaign ${campaign.name}: generation failed (${failure.code}) — ${failure.message}`)
      // Normalised so the worker can tell "do not retry" from "retry later"
      // without re-deriving the classification from the raw SDK error.
      throw new AiGenerationError(failure.code, failure.message, failure.kind)
    }
  }

  // Atomic claim: only one worker turns a job into `running`, and a job that
  // already succeeded or was cancelled is never re-run.
  private async claim(jobId: string): Promise<AiGenerationJob | null> {
    const result = await this.jobs
      .createQueryBuilder()
      .update(AiGenerationJob)
      .set({ status: 'running', startedAt: () => 'COALESCE("startedAt", now())', attempt: () => '"attempt" + 1' })
      .where('id = :id AND status IN (:...open)', { id: jobId, open: ['queued', 'running'] })
      .execute()

    if (!result.affected) {
      this.logger.warn(`Job ${jobId} is no longer runnable — skipping (duplicate delivery or cancelled)`)
      return null
    }
    return this.jobs.findOne({ where: { id: jobId } })
  }

  // Conditions checked at run time rather than at enqueue time: the operator
  // may have paused the campaign or lowered the quota while the job waited.
  private blockedReason(
    campaign: AiContentCampaign,
    job: AiGenerationJob,
  ): { code: string; message: string } | null {
    if (job.triggerType === 'test') return null
    if (!campaign.enabled || campaign.status !== 'active') {
      return { code: 'CAMPAIGN_PAUSED', message: 'Campaign was paused before this job started' }
    }
    const limit = Math.min(campaign.dailyTarget, this.config.dailyMaxPerCampaign)
    const today = localDateKey(new Date(), campaign.timezone)
    const producedToday = campaign.generatedTodayDate === today ? campaign.generatedToday : 0
    if (producedToday >= limit) {
      return { code: 'DAILY_TARGET_REACHED', message: `Daily target of ${limit} already met` }
    }
    return null
  }

  // Topic -> article -> validation -> sanitising -> draft. Any failure before
  // the final create() leaves no blog_post behind.
  private async generateDraft(campaign: AiContentCampaign, job: AiGenerationJob): Promise<BlogPost> {
    const model = this.config.model
    const timeoutMs = this.config.requestTimeoutMs

    const picked = await this.topics.pickTopic(campaign, { model, timeoutMs, excludeJobId: job.id })
    await this.jobs.update(job.id, { topic: picked.topic.slice(0, 300), normalizedTopic: picked.normalizedTopic.slice(0, 300) })

    const written = await this.provider.writeArticle({
      masterPrompt: campaign.masterPrompt,
      topic: picked.topic,
      language: campaign.language,
      tone: campaign.tone,
      keywords: campaign.keywords ?? [],
      targetWords: campaign.targetWords,
      avoidTitles: picked.avoidTitles,
      model,
      timeoutMs,
    })

    const inputTokens = picked.usage.inputTokens + written.usage.inputTokens
    const outputTokens = picked.usage.outputTokens + written.usage.outputTokens
    await this.jobs.update(job.id, {
      model,
      inputTokens,
      outputTokens,
      estimatedCost: estimateCost(model, inputTokens, outputTokens, this.config.priceOverride),
    })

    const draft = this.validateArticle(written.article, picked.topic)
    await this.topics.assertTitleIsOriginal(draft.title, campaign.id, job.id)
    return this.createDraft(draft)
  }

  // Everything the model may get wrong is corrected or rejected here — the
  // blog DTO is bypassed on this path, so the limits are re-applied by hand.
  private validateArticle(article: GeneratedArticle, topic: string): {
    title: string
    slug: string
    excerpt: string
    metaDescription: string
    content: string
  } {
    if (!article || typeof article !== 'object') {
      throw new AiPermanentError('INVALID_SHAPE', 'Model returned no article object')
    }

    const title = stripHtml(String(article.title ?? '')).trim().slice(0, TITLE_MAX)
    if (!title) throw new AiPermanentError('EMPTY_TITLE', 'Model returned an empty title')

    const content = sanitizeAiHtml(String(article.content ?? '')).trim()
    if (!content) throw new AiPermanentError('EMPTY_CONTENT', 'Article body was empty after sanitising')
    if (content.length > CONTENT_MAX) {
      throw new AiPermanentError('CONTENT_TOO_LONG', `Article body exceeds ${CONTENT_MAX} characters`)
    }
    const words = countWords(content)
    if (words < MIN_WORDS) {
      throw new AiPermanentError('CONTENT_TOO_SHORT', `Article body has only ${words} words`)
    }
    if (!/<p[\s>]/i.test(content)) {
      throw new AiPermanentError('INVALID_HTML', 'Article body contains no paragraph after sanitising')
    }

    // A malformed or reserved slug is repaired from the title rather than
    // failing the run; the collision suffix is added later.
    const proposed = String(article.slug ?? '').trim().toLowerCase()
    let slug = /^[a-z0-9-]+$/.test(proposed) ? proposed.slice(0, SLUG_MAX).replace(/^-+|-+$/g, '') : ''
    if (!slug || RESERVED_SLUGS.includes(slug)) slug = slugifyTopic(title || topic, SLUG_MAX)
    if (!slug || RESERVED_SLUGS.includes(slug)) {
      throw new AiPermanentError('INVALID_SLUG', 'Could not derive a usable slug from the article')
    }

    const excerpt = stripHtml(String(article.excerpt ?? '')).slice(0, EXCERPT_MAX)
    const metaDescription = stripHtml(String(article.metaDescription ?? '')).slice(0, META_MAX)

    return { title, slug, excerpt, metaDescription, content }
  }

  // Publication stays a human decision: published/publishedAt/coverImage are
  // forced here and are not part of the model's schema at all.
  private async createDraft(draft: {
    title: string
    slug: string
    excerpt: string
    metaDescription: string
    content: string
  }): Promise<BlogPost> {
    const base = draft.slug
    for (let attempt = 1; attempt <= SLUG_ATTEMPTS; attempt++) {
      const candidate = attempt === 1 ? base : `${base.slice(0, SLUG_MAX - 4)}-${attempt}`
      if (RESERVED_SLUGS.includes(candidate)) continue
      if (await this.posts.count({ where: { slug: candidate } })) continue

      try {
        // publishedAt/coverImage are typed non-null on the entity but are
        // nullable columns; the cast keeps the "explicitly empty" intent.
        return await this.blog.create({
          ...draft,
          slug: candidate,
          published: false,
          publishedAt: null,
          coverImage: null,
          aiGenerated: true,
        } as unknown as DeepPartial<BlogPost>)
      } catch (err) {
        // Another writer took the slug between the count and the insert.
        if (err instanceof ConflictException || isUniqueViolation(err)) continue
        throw err
      }
    }
    throw new AiPermanentError('SLUG_EXHAUSTED', `Could not find a free slug based on "${base}"`)
  }

  private async finishSucceeded(job: AiGenerationJob, blogPostId: string): Promise<void> {
    await this.jobs.update(job.id, {
      status: 'succeeded',
      blogPostId,
      errorCode: null,
      errorMessage: null,
      completedAt: new Date(),
    })
  }

  private async finishCancelled(job: AiGenerationJob, code: string, message: string): Promise<void> {
    await this.jobs.update(job.id, {
      status: 'cancelled',
      errorCode: code,
      errorMessage: redactSecrets(message, [this.config.apiKey]),
      completedAt: new Date(),
    })
    this.logger.log(`Job ${job.id} cancelled: ${code}`)
  }

  // Counter and next slot in one statement so two workers finishing at the
  // same instant cannot both read the same pre-increment value.
  private async countGeneratedArticle(campaign: AiContentCampaign): Promise<void> {
    const now = new Date()
    const today = localDateKey(now, campaign.timezone)
    const next = computeNextGenerationAt(now, campaign)
    await this.campaigns.query(
      `UPDATE ai_content_campaigns
          SET "generatedToday" = CASE WHEN "generatedTodayDate" = $2::date THEN "generatedToday" + 1 ELSE 1 END,
              "generatedTodayDate" = $2::date,
              "lastGenerationAt" = $3,
              "nextGenerationAt" = $4,
              "lastRunAt" = $3,
              "updatedAt" = now()
        WHERE id = $1`,
      [campaign.id, today, now, next],
    )
  }

  // Releases the campaign after a cancellation or a definitive failure so the
  // next slot is one interval away instead of firing immediately.
  private async rescheduleCampaign(campaign: AiContentCampaign): Promise<void> {
    const now = new Date()
    await this.campaigns.update(campaign.id, {
      nextGenerationAt: computeNextGenerationAt(now, campaign),
      lastRunAt: now,
    })
  }

  // Used by the admin panel to list the drafts a campaign produced.
  async draftsForCampaign(campaignId: string, limit = 50): Promise<BlogPost[]> {
    const jobs = await this.jobs.find({
      where: { campaignId, status: In(['succeeded']) },
      order: { completedAt: 'DESC' },
      take: limit,
      select: ['blogPostId'],
    })
    const ids = jobs.map(job => job.blogPostId).filter((id): id is string => !!id)
    if (!ids.length) return []
    return this.posts.find({
      where: { id: In(ids) },
      select: ['id', 'title', 'slug', 'published', 'createdAt', 'aiGenerated'],
      order: { createdAt: 'DESC' },
    })
  }
}
