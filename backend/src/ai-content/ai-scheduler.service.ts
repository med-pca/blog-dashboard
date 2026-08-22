import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import type Redis from 'ioredis'
import { In, LessThan, Repository } from 'typeorm'
import { REDIS_CLIENT } from '../redis/redis.module'
import { errorMessage, isUniqueViolation } from '../common/errors'
import { AiContentConfig } from './ai-content.config'
import { AiCampaignService } from './ai-campaign.service'
import { AiQueueService } from './ai-queue.service'
import { AiContentCampaign } from './entities/ai-content-campaign.entity'
import { AiGenerationJob, type AiJobTrigger } from './entities/ai-generation-job.entity'
import { clampIntoWindow, computeNextGenerationAt, isWithinWindow, localDateKey, nextDayWindowStart } from './lib/schedule'
import { RETRY_BACKOFF_BASE_MS } from './ai-queue.service'

// Only one instance may plan at a time; the lock outlives a tick but expires
// well before the next one so a crashed scheduler cannot wedge the campaign.
export const SCHEDULER_LOCK_KEY = 'ai-content:scheduler:lock'
export const SCHEDULER_LOCK_TTL_MS = 50_000

// Floor for how long a job may legitimately stay in flight before we call its
// worker lost (redeploy, OOM kill).
export const STUCK_JOB_TIMEOUT_FLOOR_MS = 30 * 60 * 1000

// The real budget has to cover every attempt plus the exponential backoff
// between them, otherwise raising AI_MAX_ATTEMPTS would make the reaper kill
// jobs that are still retrying normally.
export function stuckJobTimeoutMs(maxAttempts: number, requestTimeoutMs: number): number {
  let backoff = 0
  for (let attempt = 1; attempt < Math.max(1, maxAttempts); attempt++) {
    backoff += RETRY_BACKOFF_BASE_MS * 2 ** (attempt - 1)
  }
  // Two provider calls per attempt: topic ideas, then the article.
  const working = Math.max(1, maxAttempts) * requestTimeoutMs * 2
  return Math.max(STUCK_JOB_TIMEOUT_FLOOR_MS, backoff + working)
}

@Injectable()
export class AiSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AiSchedulerService.name)

  constructor(
    @InjectRepository(AiContentCampaign) private readonly campaigns: Repository<AiContentCampaign>,
    @InjectRepository(AiGenerationJob) private readonly jobs: Repository<AiGenerationJob>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly campaignService: AiCampaignService,
    private readonly queue: AiQueueService,
    private readonly config: AiContentConfig,
  ) {}

  onModuleInit(): void {
    this.config.logStartupState()
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.config.unavailableReason()) return

    const token = `${process.pid}-${Date.now()}`
    if (!(await this.acquireLock(token))) return

    try {
      await this.reapStuckJobs()
      for (const campaign of await this.campaignService.runnable()) {
        try {
          await this.planCampaign(campaign)
        } catch (err) {
          this.logger.error(`Scheduling failed for campaign ${campaign.name}: ${errorMessage(err)}`)
        }
      }
    } finally {
      await this.releaseLock(token)
    }
  }

  // SET NX PX: two backends ticking on the same minute, only one plans.
  private async acquireLock(token: string): Promise<boolean> {
    try {
      const result = await this.redis.set(SCHEDULER_LOCK_KEY, token, 'PX', SCHEDULER_LOCK_TTL_MS, 'NX')
      return result === 'OK'
    } catch (err) {
      // Redis down: BullMQ could not accept the job anyway, so skip quietly.
      this.logger.warn(`Scheduler lock unavailable: ${errorMessage(err)}`)
      return false
    }
  }

  private async releaseLock(token: string): Promise<void> {
    try {
      const current = await this.redis.get(SCHEDULER_LOCK_KEY)
      if (current === token) await this.redis.del(SCHEDULER_LOCK_KEY)
    } catch {
      // The TTL will clear it.
    }
  }

  // Decides whether this campaign gets one job right now. Never more than one:
  // a backlog after an outage is not replayed, it is simply resumed.
  private async planCampaign(campaign: AiContentCampaign): Promise<void> {
    const now = new Date()
    const today = localDateKey(now, campaign.timezone)

    // Daily reset happens in the campaign's own zone, not the server's.
    if (campaign.generatedTodayDate !== today) {
      await this.campaigns.update(campaign.id, { generatedToday: 0, generatedTodayDate: today })
      campaign.generatedToday = 0
      campaign.generatedTodayDate = today
    }

    const limit = this.campaignService.effectiveDailyTarget(campaign)
    if (campaign.generatedToday >= limit) {
      // Nothing left today; park the campaign on tomorrow's opening.
      const tomorrow = nextDayWindowStart(now, campaign)
      if (!campaign.nextGenerationAt || campaign.nextGenerationAt < tomorrow) {
        await this.campaigns.update(campaign.id, { nextGenerationAt: tomorrow, lastRunAt: now })
      }
      return
    }

    if (!isWithinWindow(now, campaign)) {
      const opening = clampIntoWindow(now, campaign)
      if (!campaign.nextGenerationAt || campaign.nextGenerationAt < opening) {
        await this.campaigns.update(campaign.id, { nextGenerationAt: opening, lastRunAt: now })
      }
      return
    }

    // One generation in flight per campaign — concurrency is spread across
    // campaigns, never stacked inside one.
    const active = await this.jobs.count({ where: { campaignId: campaign.id, status: In(['queued', 'running']) } })
    if (active > 0) return

    if (campaign.nextGenerationAt && campaign.nextGenerationAt > now) return

    // Deterministic slot: the same pending nextGenerationAt always produces the
    // same queue id, so a restart re-plans the identical job instead of a new one.
    const plannedFor = truncateToMinute(campaign.nextGenerationAt ?? now)
    await this.enqueueJob(campaign, plannedFor, 'scheduled', `sch:${campaign.id}:${plannedFor.getTime()}`)
  }

  // Shared by the scheduler and by the manual/test/retry endpoints.
  async enqueueJob(
    campaign: AiContentCampaign,
    plannedFor: Date,
    triggerType: AiJobTrigger,
    queueJobId: string,
  ): Promise<AiGenerationJob | null> {
    const now = new Date()
    let job: AiGenerationJob
    try {
      job = await this.jobs.save(
        this.jobs.create({
          campaignId: campaign.id,
          queueJobId,
          plannedFor,
          status: 'queued',
          triggerType,
          attempt: 0,
          maxAttempts: this.config.maxAttempts,
          model: this.config.model,
        }),
      )
    } catch (err) {
      // Another scheduler won this exact slot.
      if (isUniqueViolation(err)) {
        this.logger.debug(`Slot ${queueJobId} already claimed by another scheduler`)
        return null
      }
      throw err
    }

    // Move the campaign forward before the job runs so a slow or lost run
    // cannot make the next tick fire a catch-up burst.
    if (triggerType !== 'test') {
      await this.campaigns.update(campaign.id, {
        nextGenerationAt: computeNextGenerationAt(now, campaign),
        lastRunAt: now,
      })
    }

    try {
      await this.queue.enqueue(queueJobId, { jobId: job.id, campaignId: campaign.id })
    } catch (err) {
      await this.jobs.update(job.id, {
        status: 'failed',
        errorCode: 'ENQUEUE_FAILED',
        errorMessage: errorMessage(err).slice(0, 1000),
        completedAt: new Date(),
      })
      this.logger.error(`Could not enqueue job ${job.id}: ${errorMessage(err)}`)
      return null
    }
    return job
  }

  // A worker killed mid-generation leaves a `running` row that would block the
  // campaign forever; release it so the next tick can plan again.
  async reapStuckJobs(): Promise<number> {
    const budget = stuckJobTimeoutMs(this.config.maxAttempts, this.config.requestTimeoutMs)
    const cutoff = new Date(Date.now() - budget)
    const stuck = await this.jobs.find({
      where: { status: In(['running', 'queued']), createdAt: LessThan(cutoff) },
      take: 100,
    })
    for (const job of stuck) {
      await this.jobs.update(job.id, {
        status: 'failed',
        errorCode: 'WORKER_LOST',
        errorMessage: 'Job was still in flight after the stuck-job timeout; the worker was interrupted',
        completedAt: new Date(),
      })
      await this.queue.remove(job.queueJobId)
      this.logger.warn(`Released stuck job ${job.id} (${job.queueJobId})`)
    }
    return stuck.length
  }
}

// Second-level precision would make the queue id depend on when the tick ran.
function truncateToMinute(at: Date): Date {
  return new Date(Math.floor(at.getTime() / 60_000) * 60_000)
}
