import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue, type ConnectionOptions } from 'bullmq'
import { AiContentConfig } from './ai-content.config'

export const AI_QUEUE_NAME = 'ai-blog-generation'

// First retry waits this long, then doubles. Shared with the scheduler so its
// stuck-job budget stays in step with the real retry schedule.
export const RETRY_BACKOFF_BASE_MS = 30_000

export interface AiJobPayload {
  // Primary key of the ai_generation_jobs row this delivery is about.
  jobId: string
  campaignId: string
}

// BullMQ needs its own ioredis connection: blocking commands require
// maxRetriesPerRequest=null, which the shared REDIS_CLIENT does not use.
export function bullConnection(redisUrl: string): ConnectionOptions {
  return { url: redisUrl, maxRetriesPerRequest: null } as unknown as ConnectionOptions
}

@Injectable()
export class AiQueueService implements OnApplicationShutdown {
  private readonly logger = new Logger(AiQueueService.name)
  private queue: Queue<AiJobPayload> | null = null

  constructor(
    private readonly config: AiContentConfig,
    private readonly appConfig: ConfigService,
  ) {}

  // Built on first use so a backend running with AI_CONTENT_ENABLED=false
  // never opens a second Redis connection.
  private getQueue(): Queue<AiJobPayload> {
    if (!this.queue) {
      const url = this.appConfig.get<string>('REDIS_URL') ?? 'redis://localhost:6379'
      this.queue = new Queue<AiJobPayload>(AI_QUEUE_NAME, {
        connection: bullConnection(url),
        defaultJobOptions: {
          attempts: this.config.maxAttempts,
          backoff: { type: 'exponential', delay: RETRY_BACKOFF_BASE_MS },
          removeOnComplete: { age: 24 * 3600, count: 500 },
          removeOnFail: { age: 7 * 24 * 3600, count: 500 },
        },
      })
    }
    return this.queue
  }

  // `queueJobId` is deterministic, so a job re-enqueued after a restart (or by
  // a second scheduler in the same tick) is ignored by BullMQ instead of
  // producing a duplicate run.
  async enqueue(queueJobId: string, payload: AiJobPayload): Promise<void> {
    await this.getQueue().add('generate', payload, { jobId: queueJobId })
  }

  async remove(queueJobId: string): Promise<void> {
    try {
      await this.getQueue().remove(queueJobId)
    } catch {
      // Already gone (completed and trimmed) — nothing to clean up.
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.queue) return
    await this.queue.close().catch(err => this.logger.warn(`Queue close failed: ${err}`))
    this.queue = null
  }
}
