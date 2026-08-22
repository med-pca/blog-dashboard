import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UnrecoverableError, Worker, type Job } from 'bullmq'
import { errorMessage } from '../common/errors'
import { AiContentConfig } from './ai-content.config'
import { AiContentService } from './ai-content.service'
import { AiGenerationError } from './lib/errors'
import { AI_QUEUE_NAME, bullConnection, type AiJobPayload } from './ai-queue.service'

// Owns the BullMQ worker lifecycle. The generation logic itself lives in
// AiContentService so it can be unit-tested without Redis.
@Injectable()
export class AiGenerationProcessor implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AiGenerationProcessor.name)
  private worker: Worker<AiJobPayload> | null = null

  constructor(
    private readonly config: AiContentConfig,
    private readonly appConfig: ConfigService,
    private readonly content: AiContentService,
  ) {}

  onModuleInit(): void {
    // No worker at all when the feature is off: the backend then boots without
    // ever touching OpenAI or the generation queue.
    if (this.config.unavailableReason()) return

    const url = this.appConfig.get<string>('REDIS_URL') ?? 'redis://localhost:6379'
    this.worker = new Worker<AiJobPayload>(AI_QUEUE_NAME, job => this.handle(job), {
      connection: bullConnection(url),
      concurrency: this.config.workerConcurrency,
    })
    this.worker.on('error', err => this.logger.error(`AI worker error: ${errorMessage(err)}`))
    this.logger.log(`AI generation worker listening on "${AI_QUEUE_NAME}" (concurrency ${this.config.workerConcurrency})`)
  }

  // Exposed for tests: same body BullMQ calls per delivery.
  async handle(job: Job<AiJobPayload>): Promise<void> {
    const attempts = job.opts?.attempts ?? this.config.maxAttempts
    const isFinalAttempt = (job.attemptsMade ?? 0) + 1 >= attempts

    try {
      await this.content.runJob({ jobId: job.data.jobId, isFinalAttempt })
    } catch (err) {
      // Permanent failures are already recorded on the row; telling BullMQ not
      // to retry keeps the campaign from burning its remaining attempts.
      if (err instanceof AiGenerationError && err.kind === 'permanent') {
        throw new UnrecoverableError(`${err.code}: ${err.message}`)
      }
      throw err
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.worker) return
    await this.worker.close().catch(err => this.logger.warn(`Worker close failed: ${errorMessage(err)}`))
    this.worker = null
  }
}
