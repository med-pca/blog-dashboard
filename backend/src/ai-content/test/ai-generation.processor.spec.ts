import { ConfigService } from '@nestjs/config'
import { UnrecoverableError, type Job } from 'bullmq'
import { AiGenerationProcessor } from '../ai-generation.processor'
import { AiContentService } from '../ai-content.service'
import { AiGenerationError } from '../lib/errors'
import { makeConfig } from './helpers'
import type { AiJobPayload } from '../ai-queue.service'

function makeProcessor(runJob: jest.Mock, env: Record<string, string> = {}) {
  const content = { runJob } as unknown as AiContentService
  const appConfig = new ConfigService()
  jest.spyOn(appConfig, 'get').mockReturnValue('redis://localhost:6379' as never)
  return new AiGenerationProcessor(makeConfig(env), appConfig, content)
}

function makeBullJob(attemptsMade: number, attempts = 3): Job<AiJobPayload> {
  return {
    data: { jobId: 'job-1', campaignId: 'camp-1' },
    attemptsMade,
    opts: { attempts },
  } as unknown as Job<AiJobPayload>
}

describe('AiGenerationProcessor.handle', () => {
  it('tells the pipeline it is not the last attempt while retries remain', async () => {
    const runJob = jest.fn(() => Promise.resolve())
    await makeProcessor(runJob).handle(makeBullJob(0))
    expect(runJob).toHaveBeenCalledWith({ jobId: 'job-1', isFinalAttempt: false })
  })

  it('flags the final attempt so the campaign gets released', async () => {
    const runJob = jest.fn(() => Promise.resolve())
    await makeProcessor(runJob).handle(makeBullJob(2))
    expect(runJob).toHaveBeenCalledWith({ jobId: 'job-1', isFinalAttempt: true })
  })

  it('stops BullMQ from retrying a permanent failure', async () => {
    const runJob = jest.fn(() => Promise.reject(new AiGenerationError('INVALID_JSON', 'not JSON', 'permanent')))
    await expect(makeProcessor(runJob).handle(makeBullJob(0))).rejects.toBeInstanceOf(UnrecoverableError)
  })

  it('lets a transient failure bubble up so BullMQ backs off and retries', async () => {
    const runJob = jest.fn(() => Promise.reject(new AiGenerationError('RATE_LIMITED', '429', 'transient')))
    const error = await makeProcessor(runJob).handle(makeBullJob(0)).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AiGenerationError)
    expect(error).not.toBeInstanceOf(UnrecoverableError)
  })

  it('does not start a worker while the feature is disabled', () => {
    const processor = makeProcessor(jest.fn(), { AI_CONTENT_ENABLED: 'false' })
    expect(() => processor.onModuleInit()).not.toThrow()
    // Nothing to shut down either, so the backend closes cleanly.
    return expect(processor.onApplicationShutdown()).resolves.toBeUndefined()
  })

  it('does not start a worker when the key is missing', () => {
    const processor = makeProcessor(jest.fn(), { OPENAI_API_KEY: '' })
    expect(() => processor.onModuleInit()).not.toThrow()
  })
})
