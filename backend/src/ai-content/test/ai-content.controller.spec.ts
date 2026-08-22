import 'reflect-metadata'
import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { AiContentController } from '../ai-content.controller'
import { AiCampaignService } from '../ai-campaign.service'
import { AiContentService } from '../ai-content.service'
import { AiJobsService } from '../ai-jobs.service'
import { AiSchedulerService } from '../ai-scheduler.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CreateAiCampaignDto } from '../dto/create-ai-campaign.dto'
import { makeCampaign, makeConfig, makeJob } from './helpers'

function makeController(env: Record<string, string> = {}) {
  const campaigns = {
    findById: jest.fn(() => Promise.resolve(makeCampaign())),
    listWithCounters: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    setEnabled: jest.fn(),
    stats: jest.fn(),
  } as unknown as AiCampaignService
  const content = { draftsForCampaign: jest.fn() } as unknown as AiContentService
  const jobs = {
    countActive: jest.fn(() => Promise.resolve(0)),
    findById: jest.fn(() => Promise.resolve(makeJob({ status: 'failed' }))),
    findAll: jest.fn(() => Promise.resolve({ jobs: [], page: 1, pageCount: 1, total: 0 })),
  } as unknown as AiJobsService
  const scheduler = {
    enqueueJob: jest.fn(() => Promise.resolve(makeJob({ id: 'job-new' }))),
  } as unknown as AiSchedulerService

  const controller = new AiContentController(campaigns, content, jobs, scheduler, makeConfig(env))
  return { controller, campaigns, content, jobs, scheduler }
}

describe('AiContentController — authorisation', () => {
  it('guards the whole controller with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AiContentController) as unknown[]
    expect(guards).toContain(JwtAuthGuard)
  })

  it('leaves no route outside the class-level guard', () => {
    const routes = Object.getOwnPropertyNames(AiContentController.prototype).filter(name => name !== 'constructor')
    for (const route of routes) {
      const own = Reflect.getMetadata(GUARDS_METADATA, AiContentController.prototype[route as never]) as unknown[]
      // Either the route inherits the class guard, or it declares one itself.
      expect(own === undefined || own.includes(JwtAuthGuard)).toBe(true)
    }
  })
})

describe('AiContentController — feature flag', () => {
  it('reports the flag state without ever exposing the key', () => {
    const { controller } = makeController()
    const status = controller.status()
    expect(status).toMatchObject({ enabled: true, model: 'gpt-5-nano', unavailableReason: null })
    expect(JSON.stringify(status)).not.toContain('sk-')
  })

  it('refuses on-demand generation with 503 while the feature is off', async () => {
    const { controller } = makeController({ AI_CONTENT_ENABLED: 'false' })
    await expect(controller.test('camp-1')).rejects.toBeInstanceOf(ServiceUnavailableException)
    await expect(controller.generateNow('camp-1')).rejects.toBeInstanceOf(ServiceUnavailableException)
    await expect(controller.retry('job-1')).rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('still lists campaigns while the feature is off, so the panel stays usable', async () => {
    const { controller, campaigns } = makeController({ AI_CONTENT_ENABLED: 'false' })
    await controller.listCampaigns()
    expect(campaigns.listWithCounters).toHaveBeenCalled()
  })
})

describe('AiContentController — on-demand runs', () => {
  it('queues a test draft with triggerType=test', async () => {
    const { controller, scheduler } = makeController()
    await controller.test('camp-1')
    expect(scheduler.enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'camp-1' }),
      expect.any(Date),
      'test',
      expect.stringContaining('test:camp-1:'),
    )
  })

  it('queues the manual run with triggerType=manual', async () => {
    const { controller, scheduler } = makeController()
    const result = await controller.generateNow('camp-1')
    expect((scheduler.enqueueJob as jest.Mock).mock.calls[0][2]).toBe('manual')
    expect(result.schedule.requiredMinutes).toBe(780) // the 40 x 20 campaign
  })

  it('refuses a manual run on a paused campaign', async () => {
    const { controller, campaigns } = makeController()
    ;(campaigns.findById as jest.Mock).mockResolvedValue(makeCampaign({ enabled: false, status: 'paused' }))
    await expect(controller.generateNow('camp-1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('allows a test draft on a paused campaign', async () => {
    const { controller, campaigns, scheduler } = makeController()
    ;(campaigns.findById as jest.Mock).mockResolvedValue(makeCampaign({ enabled: false, status: 'paused' }))
    await controller.test('camp-1')
    expect(scheduler.enqueueJob).toHaveBeenCalled()
  })

  it('refuses to stack a second generation on a campaign already working', async () => {
    const { controller, jobs } = makeController()
    ;(jobs.countActive as jest.Mock).mockResolvedValue(1)
    await expect(controller.generateNow('camp-1')).rejects.toBeInstanceOf(ConflictException)
  })
})

describe('AiContentController — retry', () => {
  it('re-runs a failed job as a fresh row with triggerType=retry', async () => {
    const { controller, scheduler } = makeController()
    await controller.retry('job-1')
    expect((scheduler.enqueueJob as jest.Mock).mock.calls[0][2]).toBe('retry')
  })

  it('refuses to retry a job that succeeded', async () => {
    const { controller, jobs } = makeController()
    ;(jobs.findById as jest.Mock).mockResolvedValue(makeJob({ status: 'succeeded' }))
    await expect(controller.retry('job-1')).rejects.toBeInstanceOf(BadRequestException)
  })
})

describe('AiContentController — job filters', () => {
  it('passes through only known status and trigger values', async () => {
    const { controller, jobs } = makeController()
    await controller.listJobs('camp-1', 'failed', 'manual', '3')
    expect(jobs.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 'camp-1', status: 'failed', triggerType: 'manual', page: 3 }),
    )
  })

  it('drops filter values it does not recognise instead of erroring', async () => {
    const { controller, jobs } = makeController()
    await controller.listJobs(undefined, 'bogus', 'nonsense', 'x')
    expect(jobs.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined, triggerType: undefined, page: 1 }),
    )
  })
})

describe('CreateAiCampaignDto', () => {
  const base = { name: 'Weeknight dinners', masterPrompt: 'Simple family recipes for US home cooks, no duplicates.' }

  async function errorsFor(payload: Record<string, unknown>) {
    const dto = plainToInstance(CreateAiCampaignDto, payload)
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
    return errors.map(e => e.property)
  }

  it('accepts a complete, valid brief', async () => {
    expect(
      await errorsFor({
        ...base,
        dailyTarget: 40,
        intervalMinutes: 20,
        targetWords: 1500,
        generationStartHour: 8,
        generationEndHour: 22,
        timezone: 'America/New_York',
        keywords: ['weeknight', 'budget'],
      }),
    ).toEqual([])
  })

  it('requires a name and a substantial master prompt', async () => {
    expect(await errorsFor({ masterPrompt: base.masterPrompt })).toContain('name')
    expect(await errorsFor({ ...base, masterPrompt: 'too short' })).toContain('masterPrompt')
    expect(await errorsFor({ ...base, masterPrompt: 'x'.repeat(4001) })).toContain('masterPrompt')
  })

  it('enforces the interval floor and the daily minimum', async () => {
    expect(await errorsFor({ ...base, intervalMinutes: 4 })).toContain('intervalMinutes')
    expect(await errorsFor({ ...base, intervalMinutes: 5 })).toEqual([])
    expect(await errorsFor({ ...base, dailyTarget: 0 })).toContain('dailyTarget')
  })

  it('bounds the target length', async () => {
    expect(await errorsFor({ ...base, targetWords: 400 })).toContain('targetWords')
    expect(await errorsFor({ ...base, targetWords: 3001 })).toContain('targetWords')
  })

  it('bounds the hours and rejects an unknown timezone', async () => {
    expect(await errorsFor({ ...base, generationStartHour: 24 })).toContain('generationStartHour')
    expect(await errorsFor({ ...base, generationEndHour: 25 })).toContain('generationEndHour')
    expect(await errorsFor({ ...base, timezone: 'Mars/Olympus' })).toContain('timezone')
  })

  it('limits how many keywords and how long each one may be', async () => {
    expect(await errorsFor({ ...base, keywords: Array.from({ length: 21 }, (_, i) => `k${i}`) })).toContain('keywords')
    expect(await errorsFor({ ...base, keywords: ['x'.repeat(61)] })).toContain('keywords')
  })

  it('rejects fields that are not part of the brief', async () => {
    const dto = plainToInstance(CreateAiCampaignDto, { ...base, published: true } as never)
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
    expect(errors.map(e => e.property)).toContain('published')
  })
})
