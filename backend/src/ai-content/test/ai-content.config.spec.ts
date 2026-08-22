import { makeConfig } from './helpers'

describe('AiContentConfig', () => {
  it('is disabled unless AI_CONTENT_ENABLED is exactly "true"', () => {
    expect(makeConfig({ AI_CONTENT_ENABLED: 'false' }).enabled).toBe(false)
    expect(makeConfig({ AI_CONTENT_ENABLED: '' }).enabled).toBe(false)
    expect(makeConfig({ AI_CONTENT_ENABLED: '1' }).enabled).toBe(false)
    expect(makeConfig({ AI_CONTENT_ENABLED: 'true' }).enabled).toBe(true)
  })

  it('reports why the feature is unusable, and reports nothing when it is fine', () => {
    expect(makeConfig({ AI_CONTENT_ENABLED: 'false' }).unavailableReason()).toMatch(/disabled/)
    expect(makeConfig({ OPENAI_API_KEY: '' }).unavailableReason()).toMatch(/OPENAI_API_KEY/)
    expect(makeConfig().unavailableReason()).toBeNull()
  })

  it('does not need a key while the feature is off, so the backend still boots', () => {
    const config = makeConfig({ AI_CONTENT_ENABLED: 'false', OPENAI_API_KEY: '' })
    expect(() => config.logStartupState()).not.toThrow()
    expect(config.enabled).toBe(false)
  })

  it('falls back to documented defaults for every tunable', () => {
    const config = makeConfig({
      OPENAI_MODEL: '',
      AI_DAILY_MAX_PER_CAMPAIGN: '',
      AI_WORKER_CONCURRENCY: 'abc',
      AI_DEFAULT_INTERVAL_MINUTES: '-5',
    })
    expect(config.model).toBe('gpt-5-nano')
    expect(config.dailyMaxPerCampaign).toBe(100)
    expect(config.workerConcurrency).toBe(1)
    expect(config.defaultIntervalMinutes).toBe(20)
    expect(config.maxAttempts).toBe(3)
  })

  it('reads the configured values when they are present', () => {
    const config = makeConfig({
      AI_DAILY_MAX_PER_CAMPAIGN: '40',
      AI_WORKER_CONCURRENCY: '2',
      AI_DEFAULT_INTERVAL_MINUTES: '15',
      AI_COST_INPUT_PER_MTOK: '0.1',
      AI_COST_OUTPUT_PER_MTOK: '0.8',
    })
    expect(config.dailyMaxPerCampaign).toBe(40)
    expect(config.workerConcurrency).toBe(2)
    expect(config.defaultIntervalMinutes).toBe(15)
    expect(config.priceOverride).toEqual({ input: 0.1, output: 0.8 })
  })

  it('has no price override when only one side is configured', () => {
    expect(makeConfig({ AI_COST_INPUT_PER_MTOK: '0.1' }).priceOverride).toBeNull()
  })
})
