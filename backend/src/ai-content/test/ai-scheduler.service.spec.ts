import type Redis from 'ioredis'
import { AiCampaignService } from '../ai-campaign.service'
import { AiQueueService } from '../ai-queue.service'
import {
  AiSchedulerService,
  SCHEDULER_LOCK_KEY,
  STUCK_JOB_TIMEOUT_FLOOR_MS,
  stuckJobTimeoutMs,
} from '../ai-scheduler.service'
import { AiContentCampaign } from '../entities/ai-content-campaign.entity'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { makeCampaign, makeConfig, makeJob, makeRepo } from './helpers'

function makeScheduler(options: { campaigns?: AiContentCampaign[]; env?: Record<string, string>; lock?: boolean } = {}) {
  const campaignRepo = makeRepo<AiContentCampaign>()
  const jobRepo = makeRepo<AiGenerationJob>()
  ;(jobRepo.save as jest.Mock).mockImplementation((entity: AiGenerationJob) =>
    Promise.resolve({ ...entity, id: 'job-new' }),
  )

  const store = new Map<string, string>()
  const redis = {
    // Minimal SET NX PX behaviour, enough to prove mutual exclusion.
    set: jest.fn((key: string, value: string, _px: string, _ttl: number, nx: string) => {
      if (nx === 'NX' && store.has(key)) return Promise.resolve(null)
      store.set(key, value)
      return Promise.resolve('OK')
    }),
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    del: jest.fn((key: string) => {
      store.delete(key)
      return Promise.resolve(1)
    }),
  } as unknown as Redis

  const config = makeConfig(options.env)
  const campaignService = {
    runnable: jest.fn(() => Promise.resolve(options.campaigns ?? [])),
    effectiveDailyTarget: (campaign: AiContentCampaign) =>
      Math.min(campaign.dailyTarget, config.dailyMaxPerCampaign),
  } as unknown as AiCampaignService

  const queue = { enqueue: jest.fn(() => Promise.resolve()), remove: jest.fn(() => Promise.resolve()) } as unknown as AiQueueService

  const scheduler = new AiSchedulerService(campaignRepo, jobRepo, redis, campaignService, queue, config)
  return { scheduler, campaignRepo, jobRepo, redis, queue, store, campaignService }
}

const TODAY = () => new Date().toISOString().slice(0, 10)

describe('AiSchedulerService.tick — feature flag and lock', () => {
  it('does nothing at all while the feature is disabled', async () => {
    const { scheduler, redis, campaignService } = makeScheduler({ env: { AI_CONTENT_ENABLED: 'false' } })
    await scheduler.tick()
    expect(redis.set).not.toHaveBeenCalled()
    expect(campaignService.runnable).not.toHaveBeenCalled()
  })

  it('does nothing while enabled without a key', async () => {
    const { scheduler, campaignService } = makeScheduler({ env: { OPENAI_API_KEY: '' } })
    await scheduler.tick()
    expect(campaignService.runnable).not.toHaveBeenCalled()
  })

  it('takes a lock and releases it so the next tick can run', async () => {
    const { scheduler, redis, store } = makeScheduler()
    await scheduler.tick()
    expect(redis.set).toHaveBeenCalledWith(SCHEDULER_LOCK_KEY, expect.any(String), 'PX', expect.any(Number), 'NX')
    expect(store.has(SCHEDULER_LOCK_KEY)).toBe(false)
  })

  it('lets only one of two concurrent schedulers plan', async () => {
    const campaign = makeCampaign({ generatedTodayDate: TODAY() })
    const first = makeScheduler({ campaigns: [campaign] })
    // Second instance whose SET NX loses the race, as it would against a
    // lock the first instance already holds in the shared Redis.
    const second = makeScheduler({ campaigns: [campaign] })
    ;(second.redis.set as jest.Mock).mockResolvedValue(null)

    await Promise.all([first.scheduler.tick(), second.scheduler.tick()])
    expect(first.jobRepo.save).toHaveBeenCalledTimes(1)
    expect(second.jobRepo.save).not.toHaveBeenCalled()
  })

  it('skips the tick instead of crashing when Redis is unreachable', async () => {
    const { scheduler, redis, jobRepo } = makeScheduler({ campaigns: [makeCampaign()] })
    ;(redis.set as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED'))
    await expect(scheduler.tick()).resolves.toBeUndefined()
    expect(jobRepo.save).not.toHaveBeenCalled()
  })
})

describe('AiSchedulerService.tick — planning', () => {
  it('queues exactly one job with a deterministic id derived from the slot', async () => {
    const slot = new Date('2026-05-01T12:00:00Z')
    const campaign = makeCampaign({ nextGenerationAt: slot, generatedTodayDate: TODAY() })
    const { scheduler, jobRepo, queue } = makeScheduler({ campaigns: [campaign] })

    await scheduler.tick()

    expect(jobRepo.save).toHaveBeenCalledTimes(1)
    const created = (jobRepo.save as jest.Mock).mock.calls[0][0]
    expect(created).toMatchObject({ triggerType: 'scheduled', status: 'queued', campaignId: 'camp-1' })
    expect(created.queueJobId).toBe(`sch:camp-1:${slot.getTime()}`)
    expect(queue.enqueue).toHaveBeenCalledWith(created.queueJobId, { jobId: 'job-new', campaignId: 'camp-1' })
  })

  it('produces the same queue id after a restart, so nothing is duplicated', async () => {
    const slot = new Date('2026-05-01T12:00:00Z')
    const campaign = makeCampaign({ nextGenerationAt: slot, generatedTodayDate: TODAY() })
    const first = makeScheduler({ campaigns: [campaign] })
    const second = makeScheduler({ campaigns: [campaign] })

    await first.scheduler.tick()
    await second.scheduler.tick()

    expect((first.jobRepo.save as jest.Mock).mock.calls[0][0].queueJobId).toBe(
      (second.jobRepo.save as jest.Mock).mock.calls[0][0].queueJobId,
    )
  })

  it('drops its own row when another scheduler already claimed the slot', async () => {
    const campaign = makeCampaign({ generatedTodayDate: TODAY() })
    const { scheduler, jobRepo, queue } = makeScheduler({ campaigns: [campaign] })
    ;(jobRepo.save as jest.Mock).mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }))

    await scheduler.tick()
    expect(queue.enqueue).not.toHaveBeenCalled()
  })

  it('never replays a backlog: one job after an outage, then the normal interval', async () => {
    const campaign = makeCampaign({
      nextGenerationAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      generatedTodayDate: TODAY(),
      intervalMinutes: 20,
    })
    const { scheduler, jobRepo, campaignRepo } = makeScheduler({ campaigns: [campaign] })

    await scheduler.tick()

    expect(jobRepo.save).toHaveBeenCalledTimes(1)
    const scheduled = campaignRepo.__updates.find(u => u.nextGenerationAt)!
    const next = scheduled.nextGenerationAt as Date
    expect(next.getTime() - Date.now()).toBeGreaterThan(19 * 60_000)
    expect(next.getTime() - Date.now()).toBeLessThan(21 * 60_000)
  })

  it('waits when the next slot has not arrived yet', async () => {
    const campaign = makeCampaign({
      nextGenerationAt: new Date(Date.now() + 10 * 60_000),
      generatedTodayDate: TODAY(),
    })
    const { scheduler, jobRepo } = makeScheduler({ campaigns: [campaign] })
    await scheduler.tick()
    expect(jobRepo.save).not.toHaveBeenCalled()
  })

  it('keeps a single generation in flight per campaign', async () => {
    const campaign = makeCampaign({ generatedTodayDate: TODAY() })
    const { scheduler, jobRepo } = makeScheduler({ campaigns: [campaign] })
    ;(jobRepo.count as jest.Mock).mockResolvedValue(1)
    await scheduler.tick()
    expect(jobRepo.save).not.toHaveBeenCalled()
  })

  it('stops at the daily target and parks the campaign on tomorrow opening', async () => {
    const campaign = makeCampaign({ dailyTarget: 3, generatedToday: 3, generatedTodayDate: TODAY() })
    const { scheduler, jobRepo, campaignRepo } = makeScheduler({ campaigns: [campaign] })

    await scheduler.tick()

    expect(jobRepo.save).not.toHaveBeenCalled()
    const parked = campaignRepo.__updates.find(u => u.nextGenerationAt)!
    expect((parked.nextGenerationAt as Date).getTime()).toBeGreaterThan(Date.now())
  })

  it('caps the day at AI_DAILY_MAX_PER_CAMPAIGN even when the campaign asks for more', async () => {
    const campaign = makeCampaign({ dailyTarget: 40, generatedToday: 5, generatedTodayDate: TODAY() })
    const { scheduler, jobRepo } = makeScheduler({ campaigns: [campaign], env: { AI_DAILY_MAX_PER_CAMPAIGN: '5' } })
    await scheduler.tick()
    expect(jobRepo.save).not.toHaveBeenCalled()
  })

  it('resets the counter when the local day rolled over, then plans again', async () => {
    const campaign = makeCampaign({ dailyTarget: 3, generatedToday: 3, generatedTodayDate: '2020-01-01' })
    const { scheduler, jobRepo, campaignRepo } = makeScheduler({ campaigns: [campaign] })

    await scheduler.tick()

    expect(campaignRepo.__updates[0]).toMatchObject({ generatedToday: 0, generatedTodayDate: TODAY() })
    expect(jobRepo.save).toHaveBeenCalledTimes(1)
  })

  it('resets on the campaign timezone, not the server one', async () => {
    // 03:00 UTC on the 2nd is still the 1st in New York.
    jest.useFakeTimers().setSystemTime(new Date('2026-05-02T03:00:00Z'))
    try {
      const campaign = makeCampaign({
        timezone: 'America/New_York',
        generatedToday: 2,
        generatedTodayDate: '2026-05-01',
        generationStartHour: 0,
        generationEndHour: 24,
      })
      const { scheduler, campaignRepo } = makeScheduler({ campaigns: [campaign] })
      await scheduler.tick()
      // Still the same local day: no reset was written.
      expect(campaignRepo.__updates.some(u => u.generatedToday === 0)).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })

  it('waits outside the generation window and books the next opening', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-01T03:00:00Z'))
    try {
      const campaign = makeCampaign({
        generationStartHour: 8,
        generationEndHour: 22,
        timezone: 'UTC',
        generatedTodayDate: '2026-05-01',
      })
      const { scheduler, jobRepo, campaignRepo } = makeScheduler({ campaigns: [campaign] })

      await scheduler.tick()

      expect(jobRepo.save).not.toHaveBeenCalled()
      const opening = campaignRepo.__updates.find(u => u.nextGenerationAt)!.nextGenerationAt as Date
      expect(opening.toISOString()).toBe('2026-05-01T08:00:00.000Z')
    } finally {
      jest.useRealTimers()
    }
  })

  it('marks the job failed when the queue refuses it, rather than leaving it pending', async () => {
    const campaign = makeCampaign({ generatedTodayDate: TODAY() })
    const { scheduler, jobRepo, queue } = makeScheduler({ campaigns: [campaign] })
    ;(queue.enqueue as jest.Mock).mockRejectedValue(new Error('Redis is down'))

    await scheduler.tick()
    expect(jobRepo.__updates).toContainEqual(expect.objectContaining({ status: 'failed', errorCode: 'ENQUEUE_FAILED' }))
  })
})

describe('AiSchedulerService.reapStuckJobs', () => {
  it('releases a job whose worker never came back', async () => {
    const { scheduler, jobRepo, queue } = makeScheduler()
    ;(jobRepo.find as jest.Mock).mockResolvedValue([makeJob({ id: 'stuck-1', status: 'running' })])

    const released = await scheduler.reapStuckJobs()

    expect(released).toBe(1)
    expect(jobRepo.__updates).toContainEqual(expect.objectContaining({ status: 'failed', errorCode: 'WORKER_LOST' }))
    expect(queue.remove).toHaveBeenCalledWith('sch:camp-1:0')
  })

  it('leaves a healthy queue alone', async () => {
    const { scheduler, jobRepo } = makeScheduler()
    expect(await scheduler.reapStuckJobs()).toBe(0)
    expect(jobRepo.__updates).toHaveLength(0)
  })
})

describe('AiSchedulerService.enqueueJob — manual and test runs', () => {
  it('a test run does not move the campaign schedule', async () => {
    const campaign = makeCampaign({ nextGenerationAt: new Date('2026-05-01T12:00:00Z') })
    const { scheduler, campaignRepo } = makeScheduler()
    await scheduler.enqueueJob(campaign, new Date(), 'test', 'test:camp-1:1')
    expect(campaignRepo.update).not.toHaveBeenCalled()
  })

  it('a manual run pushes the next scheduled slot one interval out', async () => {
    const campaign = makeCampaign({ intervalMinutes: 20 })
    const { scheduler, campaignRepo } = makeScheduler()
    await scheduler.enqueueJob(campaign, new Date(), 'manual', 'manual:camp-1:1')
    const next = campaignRepo.__updates[0].nextGenerationAt as Date
    expect(next.getTime() - Date.now()).toBeGreaterThan(19 * 60_000)
  })

  it('records the trigger type so the log page can filter on it', async () => {
    const { scheduler, jobRepo } = makeScheduler()
    await scheduler.enqueueJob(makeCampaign(), new Date(), 'retry', 'retry:job-1:1')
    expect((jobRepo.save as jest.Mock).mock.calls[0][0]).toMatchObject({ triggerType: 'retry', maxAttempts: 3 })
  })
})

describe('stuckJobTimeoutMs', () => {
  it('keeps the 30 minute floor for the default retry policy', () => {
    // 3 attempts: 30s + 60s of backoff, 6 provider calls of 120s = 14 min.
    expect(stuckJobTimeoutMs(3, 120_000)).toBe(STUCK_JOB_TIMEOUT_FLOOR_MS)
  })

  it('grows with AI_MAX_ATTEMPTS so a job still retrying is never reaped', () => {
    const generous = stuckJobTimeoutMs(10, 120_000)
    expect(generous).toBeGreaterThan(STUCK_JOB_TIMEOUT_FLOOR_MS)
    // Must at least cover the exponential backoff between the ten attempts.
    expect(generous).toBeGreaterThan(30_000 * (2 ** 9 - 1))
  })

  it('never returns a nonsensical budget for a degenerate policy', () => {
    expect(stuckJobTimeoutMs(0, 0)).toBe(STUCK_JOB_TIMEOUT_FLOOR_MS)
    expect(stuckJobTimeoutMs(1, 120_000)).toBe(STUCK_JOB_TIMEOUT_FLOOR_MS)
  })
})
