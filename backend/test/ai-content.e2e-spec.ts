import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { DataSource, Repository } from 'typeorm'
import { AiCampaignService } from '../src/ai-content/ai-campaign.service'
import { AiContentService } from '../src/ai-content/ai-content.service'
import { AiJobsService } from '../src/ai-content/ai-jobs.service'
import { AiContentCampaign } from '../src/ai-content/entities/ai-content-campaign.entity'
import { AiGenerationJob } from '../src/ai-content/entities/ai-generation-job.entity'
import { BlogPost } from '../src/blog/entities/blog-post.entity'
import { AI_CONTENT_PROVIDER } from '../src/ai-content/types/ai-content.types'
import { createE2eApp, extractAdminCookie } from './e2e-utils'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'

// Exercises the statements the unit tests mock away: the raw daily-counter
// UPDATE, the query-builder claim, the unique constraint on queueJobId and the
// text[] / numeric column mappings. Runs against the throwaway Postgres with
// AI_CONTENT_ENABLED=false, so no OpenAI client is ever constructed.

const BRIEF = 'Simple, budget-friendly family recipes for US home cooks. Avoid duplicates.'

describe('AI content (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let campaigns: Repository<AiContentCampaign>
  let jobs: Repository<AiGenerationJob>
  let posts: Repository<BlogPost>
  let cookie: string

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
    const ds = app.get(DataSource)
    campaigns = ds.getRepository(AiContentCampaign)
    jobs = ds.getRepository(AiGenerationJob)
    posts = ds.getRepository(BlogPost)

    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
    cookie = extractAdminCookie(res.headers['set-cookie'])
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Jobs cascade from campaigns, but clear both so a leftover row from a
    // previous test cannot skew a count.
    await jobs.createQueryBuilder().delete().execute()
    await campaigns.createQueryBuilder().delete().execute()
  })

  it('boots with the feature disabled and reports why', async () => {
    const res = await request(server).get('/api/ai-content/status').set('Cookie', cookie).expect(200)
    expect(res.body.enabled).toBe(false)
    expect(res.body.unavailableReason).toMatch(/disabled/)
    // The key must never travel to the client, present or not.
    expect(JSON.stringify(res.body)).not.toContain('sk-')
  })

  it('refuses on-demand generation with 503 while disabled', async () => {
    const created = await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({ name: 'Disabled run', masterPrompt: BRIEF })
      .expect(201)

    await request(server)
      .post(`/api/ai-content/campaigns/${created.body.id}/test`)
      .set('Cookie', cookie)
      .expect(503)
  })

  it('round-trips a campaign through the API, keywords array included', async () => {
    const created = await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({
        name: 'Weeknight dinners',
        masterPrompt: BRIEF,
        keywords: ['weeknight', 'budget'],
        dailyTarget: 40,
        intervalMinutes: 20,
        generationStartHour: 8,
        generationEndHour: 22,
        timezone: 'America/New_York',
      })
      .expect(201)

    expect(created.body).toMatchObject({ dailyTarget: 40, intervalMinutes: 20, status: 'paused' })
    expect(created.body.keywords).toEqual(['weeknight', 'budget'])

    const stats = await request(server)
      .get(`/api/ai-content/campaigns/${created.body.id}/stats`)
      .set('Cookie', cookie)
      .expect(200)
    expect(stats.body.schedule).toMatchObject({ requiredMinutes: 780, availableMinutes: 840, fits: true })
  })

  it('rejects an invalid brief at the DTO boundary', async () => {
    await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({ name: 'Bad', masterPrompt: 'too short' })
      .expect(400)

    await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({ name: 'Bad', masterPrompt: BRIEF, intervalMinutes: 2 })
      .expect(400)

    await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({ name: 'Bad', masterPrompt: BRIEF, timezone: 'Mars/Olympus' })
      .expect(400)

    // A start hour that is not before the end hour is a cross-field rule.
    await request(server)
      .post('/api/ai-content/campaigns')
      .set('Cookie', cookie)
      .send({ name: 'Bad', masterPrompt: BRIEF, generationStartHour: 22, generationEndHour: 6 })
      .expect(400)
  })

  it('enforces the unique queue id so two schedulers cannot claim one slot', async () => {
    const campaign = await campaigns.save(
      campaigns.create({ name: 'Slot race', masterPrompt: BRIEF, keywords: [] }),
    )
    const row = {
      campaignId: campaign.id,
      queueJobId: 'sch:race:1',
      plannedFor: new Date(),
      model: 'gpt-5-nano',
    }
    await jobs.save(jobs.create(row))
    await expect(jobs.save(jobs.create(row))).rejects.toMatchObject({ code: '23505' })
  })

  it('runs the daily counter update and the claim statement against Postgres', async () => {
    const campaign = await campaigns.save(
      campaigns.create({
        name: 'Counter',
        masterPrompt: BRIEF,
        keywords: [],
        timezone: 'UTC',
        intervalMinutes: 20,
        generationStartHour: 0,
        generationEndHour: 24,
        enabled: true,
        status: 'active',
      }),
    )
    const job = await jobs.save(
      jobs.create({
        campaignId: campaign.id,
        queueJobId: 'sch:counter:1',
        plannedFor: new Date(),
        model: 'gpt-5-nano',
      }),
    )

    // A provider double: nothing here reaches OpenAI.
    const provider = app.get(AI_CONTENT_PROVIDER)
    const body = `<h2>Section</h2><p>${'Real prose about a weeknight dinner. '.repeat(40)}</p>`
    jest.spyOn(provider, 'suggestTopics').mockResolvedValue({
      topics: ['A Genuinely Unused Sheet Pan Dinner'],
      usage: { inputTokens: 100, outputTokens: 60 },
    })
    jest.spyOn(provider, 'writeArticle').mockResolvedValue({
      article: {
        title: 'A Genuinely Unused Sheet Pan Dinner',
        slug: 'a-genuinely-unused-sheet-pan-dinner',
        excerpt: 'One pan, one weeknight.',
        metaDescription: 'A simple sheet pan dinner.',
        content: body,
        suggestedKeywords: ['sheet pan'],
      },
      usage: { inputTokens: 900, outputTokens: 2100 },
    })

    await app.get(AiContentService).runJob({ jobId: job.id, isFinalAttempt: false })

    const savedJob = await jobs.findOneOrFail({ where: { id: job.id } })
    expect(savedJob.status).toBe('succeeded')
    expect(savedJob.attempt).toBe(1)
    expect(savedJob.startedAt).toBeInstanceOf(Date)
    expect(savedJob.inputTokens).toBe(1000)
    expect(savedJob.outputTokens).toBe(2160)
    // numeric(12,6) comes back as a number thanks to the column transformer.
    expect(typeof savedJob.estimatedCost).toBe('number')

    const post = await posts.findOneOrFail({ where: { id: savedJob.blogPostId! } })
    expect(post.published).toBe(false)
    expect(post.publishedAt).toBeNull()
    expect(post.coverImage).toBeNull()
    expect(post.aiGenerated).toBe(true)

    const afterFirst = await campaigns.findOneOrFail({ where: { id: campaign.id } })
    expect(afterFirst.generatedToday).toBe(1)
    expect(afterFirst.generatedTodayDate).toBe(new Date().toISOString().slice(0, 10))
    expect(afterFirst.nextGenerationAt).toBeInstanceOf(Date)

    // A second delivery of the same job must not produce a second draft.
    const before = await posts.count()
    await app.get(AiContentService).runJob({ jobId: job.id, isFinalAttempt: false })
    expect(await posts.count()).toBe(before)
    expect((await campaigns.findOneOrFail({ where: { id: campaign.id } })).generatedToday).toBe(1)

    await posts.delete({ id: post.id })
  })

  it('reads back the job list with its filters and pagination', async () => {
    const campaign = await campaigns.save(
      campaigns.create({ name: 'Listing', masterPrompt: BRIEF, keywords: [] }),
    )
    await jobs.save([
      jobs.create({ campaignId: campaign.id, queueJobId: 'l:1', plannedFor: new Date(), model: 'm', status: 'failed', triggerType: 'manual' }),
      jobs.create({ campaignId: campaign.id, queueJobId: 'l:2', plannedFor: new Date(), model: 'm', status: 'succeeded', triggerType: 'scheduled' }),
    ])

    const all = await request(server).get('/api/ai-content/jobs').set('Cookie', cookie).expect(200)
    expect(all.body.total).toBe(2)
    expect(all.body.jobs[0].campaign).toMatchObject({ name: 'Listing' })

    const failed = await request(server)
      .get('/api/ai-content/jobs?status=failed&triggerType=manual')
      .set('Cookie', cookie)
      .expect(200)
    expect(failed.body.total).toBe(1)

    expect(await app.get(AiJobsService).countActive(campaign.id)).toBe(0)
  })

  it('keeps a campaign that already produced drafts', async () => {
    const campaign = await campaigns.save(
      campaigns.create({ name: 'Has history', masterPrompt: BRIEF, keywords: [] }),
    )
    await jobs.save(
      jobs.create({ campaignId: campaign.id, queueJobId: 'h:1', plannedFor: new Date(), model: 'm', status: 'succeeded' }),
    )

    await request(server).delete(`/api/ai-content/campaigns/${campaign.id}`).set('Cookie', cookie).expect(409)
    expect(await campaigns.count({ where: { id: campaign.id } })).toBe(1)
  })

  it('deletes a campaign that never produced anything, taking its jobs with it', async () => {
    const campaign = await campaigns.save(
      campaigns.create({ name: 'No history', masterPrompt: BRIEF, keywords: [] }),
    )
    await jobs.save(
      jobs.create({ campaignId: campaign.id, queueJobId: 'n:1', plannedFor: new Date(), model: 'm', status: 'failed' }),
    )

    await request(server).delete(`/api/ai-content/campaigns/${campaign.id}`).set('Cookie', cookie).expect(204)
    expect(await jobs.count({ where: { campaignId: campaign.id } })).toBe(0)
    expect(await app.get(AiCampaignService).findAll()).toHaveLength(0)
  })
})
