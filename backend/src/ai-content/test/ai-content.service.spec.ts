import { ConflictException } from '@nestjs/common'
import { AiContentService } from '../ai-content.service'
import { AiTopicService } from '../ai-topic.service'
import { BlogService } from '../../blog/blog.service'
import { BlogPost } from '../../blog/entities/blog-post.entity'
import { AiContentCampaign } from '../entities/ai-content-campaign.entity'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { AiPermanentError, AiTransientError } from '../lib/errors'
import { makeArticle, makeCampaign, makeConfig, makeJob, makeQueryBuilder, makeRepo } from './helpers'
import type { AiContentProvider } from '../types/ai-content.types'

const API_KEY = 'sk-proj-TESTKEY000011112222333344445555'
const TOPIC = 'Sheet Pan Honey Garlic Chicken'

function makeService(options: {
  campaign?: Partial<AiContentCampaign>
  job?: Partial<AiGenerationJob>
  article?: Record<string, unknown>
  writeArticle?: jest.Mock
  claimAffected?: number
  env?: Record<string, string>
} = {}) {
  const campaign = makeCampaign(options.campaign)
  const job = makeJob({ campaignId: campaign.id, ...options.job })

  const campaigns = makeRepo<AiContentCampaign>()
  ;(campaigns.findOne as jest.Mock).mockResolvedValue(campaign)

  const jobs = makeRepo<AiGenerationJob>()
  ;(jobs.findOne as jest.Mock).mockResolvedValue(job)
  ;(jobs.createQueryBuilder as jest.Mock).mockReturnValue(
    makeQueryBuilder({ affected: options.claimAffected ?? 1 }),
  )

  const posts = makeRepo<BlogPost>()
  ;(posts.count as jest.Mock).mockResolvedValue(0)

  const provider: AiContentProvider = {
    suggestTopics: jest.fn(),
    writeArticle:
      options.writeArticle ??
      jest.fn(() =>
        Promise.resolve({
          article: makeArticle(options.article),
          usage: { inputTokens: 900, outputTokens: 2100 },
        }),
      ),
  }

  const topics = {
    pickTopic: jest.fn(() =>
      Promise.resolve({
        topic: TOPIC,
        normalizedTopic: 'sheet pan honey garlic chicken',
        usage: { inputTokens: 100, outputTokens: 60 },
        avoidTitles: ['No Knead Sourdough'],
      }),
    ),
    assertTitleIsOriginal: jest.fn(() => Promise.resolve()),
  } as unknown as AiTopicService

  const created: Array<Record<string, unknown>> = []
  const blog = {
    create: jest.fn((dto: Record<string, unknown>) => {
      created.push(dto)
      return Promise.resolve({ id: 'post-1', ...dto })
    }),
  } as unknown as BlogService

  const service = new AiContentService(
    campaigns,
    jobs,
    posts,
    provider,
    topics,
    blog,
    makeConfig({ OPENAI_API_KEY: API_KEY, ...options.env }),
  )
  return { service, campaigns, jobs, posts, provider, topics, blog, created, campaign, job }
}

const RUN = { jobId: 'job-1', isFinalAttempt: false }

describe('AiContentService — happy path', () => {
  it('creates a draft that is never published and carries no cover image', async () => {
    const { service, created } = makeService()
    await service.runJob(RUN)

    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({
      published: false,
      publishedAt: null,
      coverImage: null,
      aiGenerated: true,
      title: 'Sheet Pan Honey Garlic Chicken',
      slug: 'sheet-pan-honey-garlic-chicken',
    })
  })

  it('ignores a published flag the model tries to smuggle in', async () => {
    const { service, created } = makeService({ article: { published: true, publishedAt: '2026-01-01' } })
    await service.runJob(RUN)
    expect(created[0].published).toBe(false)
    expect(created[0].publishedAt).toBeNull()
  })

  it('records the token totals of both calls and the derived cost', async () => {
    const { service, jobs } = makeService()
    await service.runJob(RUN)

    const usage = jobs.__updates.find(u => u.inputTokens !== undefined)!
    expect(usage.inputTokens).toBe(1000) // 100 topic + 900 article
    expect(usage.outputTokens).toBe(2160) // 60 topic + 2100 article
    // 1000/1e6*0.05 + 2160/1e6*0.40
    expect(usage.estimatedCost).toBeCloseTo(0.000914, 6)
  })

  it('links the job to the post it produced', async () => {
    const { service, jobs } = makeService()
    await service.runJob(RUN)
    expect(jobs.__updates).toContainEqual(expect.objectContaining({ status: 'succeeded', blogPostId: 'post-1' }))
  })

  it('counts the article against today and books the next slot one interval out', async () => {
    const { service, campaigns } = makeService({ campaign: { intervalMinutes: 20 } })
    await service.runJob(RUN)

    const [sql, params] = (campaigns.query as jest.Mock).mock.calls[0]
    expect(sql).toContain('"generatedToday" = CASE WHEN "generatedTodayDate" = $2::date')
    const [, , now, next] = params as [string, string, Date, Date]
    expect(next.getTime() - now.getTime()).toBe(20 * 60_000)
  })
})

describe('AiContentService — test drafts', () => {
  it('produces a draft without touching the daily counter', async () => {
    const { service, campaigns, created } = makeService({ job: { triggerType: 'test' } })
    await service.runJob(RUN)

    expect(created).toHaveLength(1)
    expect(campaigns.query).not.toHaveBeenCalled()
    expect(campaigns.__updates.some(u => 'nextGenerationAt' in u)).toBe(true)
  })

  it('still runs while the campaign is paused', async () => {
    const { service, created } = makeService({
      job: { triggerType: 'test' },
      campaign: { enabled: false, status: 'paused' },
    })
    await service.runJob(RUN)
    expect(created).toHaveLength(1)
  })
})

describe('AiContentService — content validation', () => {
  it('strips scripts, iframes and event handlers from the body', async () => {
    const { service, created } = makeService({
      article: {
        content:
          '<h2>Hi</h2><script>alert(1)</script><iframe src="https://evil.example"></iframe>' +
          `<p onclick="steal()">${'Safe prose about dinner. '.repeat(40)}</p>` +
          '<a href="javascript:alert(1)">x</a>',
      },
    })
    await service.runJob(RUN)

    const content = created[0].content as string
    expect(content).not.toContain('<script')
    expect(content).not.toContain('<iframe')
    expect(content).not.toContain('onclick')
    expect(content).not.toContain('javascript:')
  })

  it('demotes a stray h1 instead of dropping the section', async () => {
    const { service, created } = makeService({
      article: { content: `<h1>Ingredients</h1><p>${'Words about the dish. '.repeat(40)}</p>` },
    })
    await service.runJob(RUN)
    expect(created[0].content).toContain('<h2>Ingredients</h2>')
  })

  it('fails without creating a post when the body is empty after sanitising', async () => {
    const { service, created, jobs } = makeService({ article: { content: '<script>alert(1)</script>' } })
    await expect(service.runJob(RUN)).rejects.toMatchObject({ code: 'EMPTY_CONTENT' })
    expect(created).toHaveLength(0)
    expect(jobs.__updates).toContainEqual(expect.objectContaining({ status: 'failed', errorCode: 'EMPTY_CONTENT' }))
  })

  it('rejects a stub that is far below a usable length', async () => {
    const { service, created } = makeService({ article: { content: '<p>Too short.</p>' } })
    await expect(service.runJob(RUN)).rejects.toMatchObject({ code: 'CONTENT_TOO_SHORT' })
    expect(created).toHaveLength(0)
  })

  it('rejects a body with no paragraph left after sanitising', async () => {
    const { service } = makeService({ article: { content: `<h2>${'Only headings here. '.repeat(60)}</h2>` } })
    await expect(service.runJob(RUN)).rejects.toMatchObject({ code: 'INVALID_HTML' })
  })

  it('rejects an empty title', async () => {
    const { service, created } = makeService({ article: { title: '   ' } })
    await expect(service.runJob(RUN)).rejects.toMatchObject({ code: 'EMPTY_TITLE' })
    expect(created).toHaveLength(0)
  })

  it('trims a title and an excerpt that exceed the blog limits', async () => {
    const { service, created } = makeService({
      article: { title: 'T'.repeat(400), excerpt: 'E'.repeat(900), metaDescription: 'M'.repeat(400) },
    })
    await service.runJob(RUN)
    expect((created[0].title as string).length).toBe(255)
    expect((created[0].excerpt as string).length).toBe(500)
    expect((created[0].metaDescription as string).length).toBe(160)
  })
})

describe('AiContentService — slugs', () => {
  it('rebuilds the slug from the title when the model returns a reserved one', async () => {
    const { service, created } = makeService({ article: { slug: 'admin' } })
    await service.runJob(RUN)
    expect(created[0].slug).toBe('sheet-pan-honey-garlic-chicken')
  })

  it('rebuilds the slug when the model returns an invalid shape', async () => {
    const { service, created } = makeService({ article: { slug: 'Not A Valid Slug!' } })
    await service.runJob(RUN)
    expect(created[0].slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('suffixes the slug when the base is already taken', async () => {
    const { service, posts, created } = makeService()
    ;(posts.count as jest.Mock).mockImplementation(({ where }: { where: { slug: string } }) =>
      Promise.resolve(where.slug === 'sheet-pan-honey-garlic-chicken' ? 1 : 0),
    )
    await service.runJob(RUN)
    expect(created[0].slug).toBe('sheet-pan-honey-garlic-chicken-2')
  })

  it('retries the next suffix when a concurrent writer wins the insert', async () => {
    const { service, blog, created } = makeService()
    ;(blog.create as jest.Mock).mockImplementationOnce(() => Promise.reject(new ConflictException('taken')))
    await service.runJob(RUN)
    expect(created).toHaveLength(1)
    expect(created[0].slug).toBe('sheet-pan-honey-garlic-chicken-2')
  })
})

describe('AiContentService — failures', () => {
  it('keeps a rate limit retryable and leaves the job in flight', async () => {
    const write = jest.fn(() => Promise.reject(Object.assign(new Error('Rate limit reached'), { status: 429 })))
    const { service, jobs, created } = makeService({ writeArticle: write })

    await expect(service.runJob(RUN)).rejects.toMatchObject({ kind: 'transient', code: 'RATE_LIMITED' })
    expect(created).toHaveLength(0)
    expect(jobs.__updates.some(u => u.status === 'failed')).toBe(false)
  })

  it('finalises a rate limit once the last attempt is spent', async () => {
    const write = jest.fn(() => Promise.reject(Object.assign(new Error('Rate limit reached'), { status: 429 })))
    const { service, jobs, campaigns } = makeService({ writeArticle: write })

    await expect(service.runJob({ jobId: 'job-1', isFinalAttempt: true })).rejects.toMatchObject({ kind: 'transient' })
    expect(jobs.__updates).toContainEqual(expect.objectContaining({ status: 'failed', errorCode: 'RATE_LIMITED' }))
    // The campaign is released so the next tick can plan again.
    expect(campaigns.__updates.some(u => 'nextGenerationAt' in u)).toBe(true)
  })

  it('treats an upstream 500 and a timeout as transient', async () => {
    const five = makeService({ writeArticle: jest.fn(() => Promise.reject(Object.assign(new Error('server_error'), { status: 500 }))) })
    await expect(five.service.runJob(RUN)).rejects.toMatchObject({ kind: 'transient', code: 'UPSTREAM_500' })

    const slow = makeService({
      writeArticle: jest.fn(() =>
        Promise.reject(Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' })),
      ),
    })
    await expect(slow.service.runJob(RUN)).rejects.toMatchObject({ kind: 'transient', code: 'TIMEOUT' })
  })

  it('does not retry unparsable output', async () => {
    const write = jest.fn(() => Promise.reject(new AiPermanentError('INVALID_JSON', 'Model response was not valid JSON')))
    const { service, jobs, created } = makeService({ writeArticle: write })

    await expect(service.runJob(RUN)).rejects.toMatchObject({ kind: 'permanent', code: 'INVALID_JSON' })
    expect(created).toHaveLength(0)
    expect(jobs.__updates).toContainEqual(expect.objectContaining({ status: 'failed', errorCode: 'INVALID_JSON' }))
  })

  it('does not retry an exhausted topic space', async () => {
    const { service, topics, created } = makeService()
    ;(topics.pickTopic as jest.Mock).mockRejectedValue(new AiPermanentError('TOPIC_EXHAUSTED', 'no original topic'))
    await expect(service.runJob(RUN)).rejects.toMatchObject({ kind: 'permanent', code: 'TOPIC_EXHAUSTED' })
    expect(created).toHaveLength(0)
  })

  it('retries a truncated response', async () => {
    const write = jest.fn(() => Promise.reject(new AiTransientError('OUTPUT_TRUNCATED', 'hit the ceiling')))
    const { service } = makeService({ writeArticle: write })
    await expect(service.runJob(RUN)).rejects.toMatchObject({ kind: 'transient', code: 'OUTPUT_TRUNCATED' })
  })

  it('never writes the API key into the job row or the message', async () => {
    const write = jest.fn(() =>
      Promise.reject(Object.assign(new Error(`Incorrect API key provided: ${API_KEY}`), { status: 401 })),
    )
    const { service, jobs } = makeService({ writeArticle: write })

    await expect(service.runJob({ jobId: 'job-1', isFinalAttempt: true })).rejects.toMatchObject({ kind: 'permanent' })
    const recorded = JSON.stringify(jobs.__updates)
    expect(recorded).not.toContain(API_KEY)
    expect(recorded).toContain('[REDACTED]')
  })
})

describe('AiContentService — guards', () => {
  it('ignores a second delivery of a job that already completed', async () => {
    const { service, created, provider } = makeService({ claimAffected: 0 })
    await service.runJob(RUN)
    expect(created).toHaveLength(0)
    expect(provider.writeArticle).not.toHaveBeenCalled()
  })

  it('cancels a scheduled job whose campaign was paused while it waited', async () => {
    const { service, jobs, created } = makeService({ campaign: { enabled: false, status: 'paused' } })
    await service.runJob(RUN)
    expect(created).toHaveLength(0)
    expect(jobs.__updates).toContainEqual(expect.objectContaining({ status: 'cancelled', errorCode: 'CAMPAIGN_PAUSED' }))
  })

  it('cancels a scheduled job when the quota was lowered below what is already done', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { service, jobs, created } = makeService({
      campaign: { dailyTarget: 3, generatedToday: 3, generatedTodayDate: today },
    })
    await service.runJob(RUN)
    expect(created).toHaveLength(0)
    expect(jobs.__updates).toContainEqual(
      expect.objectContaining({ status: 'cancelled', errorCode: 'DAILY_TARGET_REACHED' }),
    )
  })

  it('respects AI_DAILY_MAX_PER_CAMPAIGN even when the campaign asks for more', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { service, created } = makeService({
      env: { AI_DAILY_MAX_PER_CAMPAIGN: '5' },
      campaign: { dailyTarget: 40, generatedToday: 5, generatedTodayDate: today },
    })
    await service.runJob(RUN)
    expect(created).toHaveLength(0)
  })

  it('starts a fresh day when the stored counter belongs to yesterday', async () => {
    const { service, created } = makeService({
      campaign: { dailyTarget: 3, generatedToday: 3, generatedTodayDate: '2020-01-01' },
    })
    await service.runJob(RUN)
    expect(created).toHaveLength(1)
  })
})
