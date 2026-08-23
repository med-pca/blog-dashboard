import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { AiCampaignService } from '../ai-campaign.service'
import { AiContentCampaign } from '../entities/ai-content-campaign.entity'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { makeCampaign, makeConfig, makeQueryBuilder, makeRepo, type MockRepo } from './helpers'

function makeService(env: Record<string, string> = {}) {
  const campaigns = makeRepo<AiContentCampaign>() as MockRepo<AiContentCampaign>
  const jobs = makeRepo<AiGenerationJob>() as MockRepo<AiGenerationJob>
  const service = new AiCampaignService(campaigns, jobs, makeConfig(env))
  return { service, campaigns, jobs }
}

const VALID = {
  name: 'Weeknight dinners',
  collectionId: '11111111-1111-4111-8111-111111111111',
  masterPrompt: 'Simple, budget-friendly family recipes for US home cooks. Avoid duplicates.',
}

describe('AiCampaignService.create', () => {
  it('stores the brief with the documented defaults and starts paused', async () => {
    const { service } = makeService()
    const saved = await service.create({ ...VALID })
    expect(saved).toMatchObject({
      language: 'English',
      targetWords: 1200,
      dailyTarget: 2,
      intervalMinutes: 20,
      status: 'paused',
      nextGenerationAt: null,
    })
  })

  it('takes the default interval from AI_DEFAULT_INTERVAL_MINUTES', async () => {
    const { service } = makeService({ AI_DEFAULT_INTERVAL_MINUTES: '35' })
    const saved = await service.create({ ...VALID })
    expect(saved.intervalMinutes).toBe(35)
  })

  it('keeps the daily count and the interval fully configurable', async () => {
    const { service } = makeService()
    const saved = await service.create({ ...VALID, dailyTarget: 40, intervalMinutes: 20 })
    expect(saved.dailyTarget).toBe(40)
    expect(saved.intervalMinutes).toBe(20)
  })

  it('refuses a daily target above AI_DAILY_MAX_PER_CAMPAIGN', async () => {
    const { service } = makeService({ AI_DAILY_MAX_PER_CAMPAIGN: '25' })
    await expect(service.create({ ...VALID, dailyTarget: 40 })).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.create({ ...VALID, dailyTarget: 25 })).resolves.toMatchObject({ dailyTarget: 25 })
  })

  it('refuses a window whose end is not after its start', async () => {
    const { service } = makeService()
    await expect(
      service.create({ ...VALID, generationStartHour: 22, generationEndHour: 6 }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('refuses an unknown timezone', async () => {
    const { service } = makeService()
    await expect(service.create({ ...VALID, timezone: 'Mars/Olympus' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('schedules the first slot immediately when created already enabled', async () => {
    const { service } = makeService()
    const saved = await service.create({ ...VALID, enabled: true, generationStartHour: 0, generationEndHour: 24 })
    expect(saved.status).toBe('active')
    expect(saved.nextGenerationAt).toBeInstanceOf(Date)
  })
})

describe('AiCampaignService pause / resume', () => {
  it('pausing clears the next slot so the scheduler stops planning', async () => {
    const { service, campaigns } = makeService()
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(makeCampaign({ nextGenerationAt: new Date() }))
    const paused = await service.setEnabled('camp-1', false)
    expect(paused).toMatchObject({ enabled: false, status: 'paused', nextGenerationAt: null })
  })

  it('resuming re-opens the schedule from now, not from the stale slot', async () => {
    const { service, campaigns } = makeService()
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(
      makeCampaign({ enabled: false, status: 'paused', nextGenerationAt: new Date('2020-01-01T00:00:00Z') }),
    )
    const resumed = await service.setEnabled('camp-1', true)
    expect(resumed.status).toBe('active')
    expect(resumed.nextGenerationAt!.getTime()).toBeGreaterThan(Date.now() - 5_000)
  })

  it('reports a missing campaign as 404', async () => {
    const { service } = makeService()
    await expect(service.findById('nope')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('AiCampaignService.update', () => {
  it('re-validates the new quota against the environment cap', async () => {
    const { service, campaigns } = makeService({ AI_DAILY_MAX_PER_CAMPAIGN: '10' })
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(makeCampaign({ dailyTarget: 5 }))
    await expect(service.update('camp-1', { dailyTarget: 40 })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('pulls the next slot back into the window when the window moves', async () => {
    const { service, campaigns } = makeService()
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(
      makeCampaign({ nextGenerationAt: new Date('2020-01-01T00:00:00Z'), timezone: 'UTC' }),
    )
    const updated = await service.update('camp-1', { generationStartHour: 9, generationEndHour: 17 })
    expect(updated.nextGenerationAt!.getTime()).toBeGreaterThan(Date.now() - 5_000)
  })
})

describe('AiCampaignService.remove', () => {
  it('keeps a campaign that already produced drafts', async () => {
    const { service, campaigns, jobs } = makeService()
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(makeCampaign())
    ;(jobs.count as jest.Mock).mockResolvedValue(7)
    await expect(service.remove('camp-1')).rejects.toBeInstanceOf(ConflictException)
    expect(campaigns.remove).not.toHaveBeenCalled()
  })

  it('deletes a campaign that never produced anything', async () => {
    const { service, campaigns, jobs } = makeService()
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(makeCampaign())
    ;(jobs.count as jest.Mock).mockResolvedValue(0)
    await service.remove('camp-1')
    expect(campaigns.remove).toHaveBeenCalled()
  })
})

describe('AiCampaignService.stats', () => {
  it('caps the reported target at the environment maximum and reports the window', async () => {
    const { service, campaigns, jobs } = makeService({ AI_DAILY_MAX_PER_CAMPAIGN: '30' })
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(
      makeCampaign({ dailyTarget: 40, generatedToday: 4, generationStartHour: 8, generationEndHour: 22 }),
    )
    ;(jobs.count as jest.Mock).mockResolvedValue(1)
    ;(jobs.createQueryBuilder as jest.Mock).mockReturnValue(
      makeQueryBuilder({ inputTokens: '12000', outputTokens: '34000', estimatedCost: '0.0142' }),
    )

    const stats = await service.stats('camp-1')
    expect(stats.dailyTarget).toBe(30)
    expect(stats.remainingToday).toBe(26)
    expect(stats.inputTokens).toBe(12000)
    expect(stats.outputTokens).toBe(34000)
    expect(stats.estimatedCost).toBe(0.0142)
    expect(stats.schedule.requiredMinutes).toBe(780)
    expect(stats.schedule.availableMinutes).toBe(840)
    expect(stats.unavailableReason).toBeNull()
  })

  it('surfaces the reason generation is off so the panel can explain itself', async () => {
    const { service, campaigns, jobs } = makeService({ AI_CONTENT_ENABLED: 'false' })
    ;(campaigns.findOne as jest.Mock).mockResolvedValue(makeCampaign())
    ;(jobs.createQueryBuilder as jest.Mock).mockReturnValue(makeQueryBuilder({}))
    const stats = await service.stats('camp-1')
    expect(stats.unavailableReason).toMatch(/disabled/)
  })
})
