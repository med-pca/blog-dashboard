import { ConfigService } from '@nestjs/config'
import { ObjectLiteral, Repository } from 'typeorm'
import { AiContentConfig } from '../ai-content.config'
import { AiConfig } from '../../ai/ai.config'
import { OpenAiClient } from '../../ai/openai.client'
import { OpenAiContentProvider } from '../providers/openai.provider'
import { AiContentCampaign } from '../entities/ai-content-campaign.entity'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { Project } from '../../projects/entities/project.entity'

// Thin stand-ins for the pieces the AI services touch. Kept here so each spec
// states only what it actually cares about.

export function makeConfig(env: Record<string, string> = {}): AiContentConfig {
  const values: Record<string, string> = {
    AI_CONTENT_ENABLED: 'true',
    OPENAI_API_KEY: 'sk-proj-TESTKEY000011112222333344445555',
    OPENAI_MODEL: 'gpt-5-nano',
    ...env,
  }
  const config = new ConfigService()
  jest.spyOn(config, 'get').mockImplementation(((key: string) => values[key]) as never)
  return new AiContentConfig(config)
}

// The provider now reaches OpenAI through the shared client, so a spec builds
// both halves from the same fake environment.
export function makeProvider(env: Record<string, string> = {}): OpenAiContentProvider {
  const values: Record<string, string> = {
    OPENAI_API_KEY: 'sk-proj-TESTKEY000011112222333344445555',
    OPENAI_MODEL: 'gpt-5-nano',
    ...env,
  }
  const config = new ConfigService()
  jest.spyOn(config, 'get').mockImplementation(((key: string) => values[key]) as never)
  return new OpenAiContentProvider(makeConfig(env), new OpenAiClient(new AiConfig(config)))
}

export function makeCampaign(overrides: Partial<AiContentCampaign> = {}): AiContentCampaign {
  const collection = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Weeknight Dinners',
    category: 'Family Meals',
    description: 'Practical dinners for busy weeknights.',
    published: true,
  } as Project
  return {
    id: 'camp-1',
    name: 'Weeknight dinners',
    masterPrompt: 'Simple, budget-friendly family recipes for US home cooks.',
    collectionId: collection.id,
    collection,
    language: 'English',
    tone: 'friendly and practical',
    targetWords: 1200,
    keywords: ['weeknight', 'budget'],
    dailyTarget: 40,
    intervalMinutes: 20,
    generationStartHour: 0,
    generationEndHour: 24,
    timezone: 'UTC',
    enabled: true,
    status: 'active',
    generatedToday: 0,
    generatedTodayDate: null,
    lastGenerationAt: null,
    nextGenerationAt: null,
    lastRunAt: null,
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function makeJob(overrides: Partial<AiGenerationJob> = {}): AiGenerationJob {
  return {
    id: 'job-1',
    campaignId: 'camp-1',
    queueJobId: 'sch:camp-1:0',
    plannedFor: new Date('2026-05-01T12:00:00Z'),
    topic: null,
    normalizedTopic: null,
    status: 'queued',
    triggerType: 'scheduled',
    attempt: 0,
    maxAttempts: 3,
    blogPostId: null,
    model: 'gpt-5-nano',
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-05-01T12:00:00Z'),
    updatedAt: new Date('2026-05-01T12:00:00Z'),
    ...overrides,
  }
}

export interface MockRepo<T extends ObjectLiteral> extends Repository<T> {
  __updates: Array<Record<string, unknown>>
}

// A repository double that records every update() payload so a spec can assert
// what was written without a database.
export function makeRepo<T extends ObjectLiteral>(overrides: Partial<Record<keyof Repository<T>, unknown>> = {}): MockRepo<T> {
  const updates: Array<Record<string, unknown>> = []
  const repo = {
    __updates: updates,
    create: jest.fn((dto: Partial<T>) => ({ ...dto })),
    save: jest.fn((entity: T) => Promise.resolve(entity)),
    insert: jest.fn(() => Promise.resolve({})),
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    findAndCount: jest.fn(() => Promise.resolve([[], 0])),
    count: jest.fn(() => Promise.resolve(0)),
    remove: jest.fn((entity: T) => Promise.resolve(entity)),
    query: jest.fn(() => Promise.resolve([])),
    update: jest.fn((_id: unknown, payload: Record<string, unknown>) => {
      updates.push(payload)
      return Promise.resolve({ affected: 1 })
    }),
    createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    metadata: { tableName: 'mock' },
    ...overrides,
  } as unknown as MockRepo<T>
  return repo
}

// Chainable query-builder double; every terminal call resolves to a value the
// spec can override per test.
export function makeQueryBuilder(result: Record<string, unknown> = { affected: 1 }) {
  const builder: Record<string, unknown> = {}
  const chain = [
    'select', 'addSelect', 'update', 'set', 'where', 'andWhere', 'groupBy', 'addGroupBy', 'orderBy', 'take', 'skip', 'setParameters',
  ]
  for (const method of chain) builder[method] = jest.fn(() => builder)
  builder.execute = jest.fn(() => Promise.resolve(result))
  builder.getRawOne = jest.fn(() => Promise.resolve(result))
  builder.getRawMany = jest.fn(() => Promise.resolve([]))
  return builder
}

// A complete, valid article the provider double can hand back.
export function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Sheet Pan Honey Garlic Chicken',
    slug: 'sheet-pan-honey-garlic-chicken',
    excerpt: 'A one-pan dinner that comes together on a weeknight.',
    metaDescription: 'A simple sheet pan chicken dinner with a honey garlic glaze.',
    content: `<h2>Why this works</h2><p>${'Sheet pan dinners keep the cleanup small and the flavour big. '.repeat(30)}</p>`,
    imagePrompt: 'Honey garlic chicken pieces with roasted potatoes on a cream ceramic platter.',
    suggestedKeywords: ['sheet pan', 'chicken'],
    ...overrides,
  }
}
