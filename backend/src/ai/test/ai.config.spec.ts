import { ConfigService } from '@nestjs/config'
import { AiConfig } from '../ai.config'

function makeConfig(env: Record<string, string> = {}): AiConfig {
  const config = new ConfigService()
  jest.spyOn(config, 'get').mockImplementation(((key: string) => env[key]) as never)
  return new AiConfig(config)
}

// ÉTAPE 6: the migration stays reversible while it is being validated, but
// OpenAI is what an unconfigured deployment gets.
describe('AiConfig.provider', () => {
  it('defaults to openai when AI_PROVIDER is unset or blank', () => {
    expect(makeConfig().provider).toBe('openai')
    expect(makeConfig({ AI_PROVIDER: '' }).provider).toBe('openai')
    expect(makeConfig({ AI_PROVIDER: '   ' }).provider).toBe('openai')
  })

  it('selects the legacy adapter only on an explicit AI_PROVIDER=groq', () => {
    expect(makeConfig({ AI_PROVIDER: 'groq' }).provider).toBe('groq')
    expect(makeConfig({ AI_PROVIDER: 'GROQ' }).provider).toBe('groq')
  })

  it('falls back to openai rather than failing on an unknown provider name', () => {
    expect(makeConfig({ AI_PROVIDER: 'anthropic' }).provider).toBe('openai')
  })
})

describe('AiConfig knobs', () => {
  it('applies the documented defaults', () => {
    const config = makeConfig()
    expect(config.model).toBe('gpt-5-nano')
    expect(config.timeoutMs).toBe(120_000)
    expect(config.maxRetries).toBe(3)
    expect(config.apiKey).toBe('')
  })

  it('reads the configured values', () => {
    const config = makeConfig({
      OPENAI_MODEL: 'gpt-5-mini',
      OPENAI_TIMEOUT_MS: '30000',
      OPENAI_MAX_RETRIES: '1',
      OPENAI_API_KEY: '  sk-proj-TESTKEY0000  ',
    })
    expect(config.model).toBe('gpt-5-mini')
    expect(config.timeoutMs).toBe(30_000)
    expect(config.maxRetries).toBe(1)
    // Trimmed: a trailing newline pasted into a dashboard would break the header.
    expect(config.apiKey).toBe('sk-proj-TESTKEY0000')
  })

  it('accepts zero retries but rejects nonsense', () => {
    expect(makeConfig({ OPENAI_MAX_RETRIES: '0' }).maxRetries).toBe(0)
    expect(makeConfig({ OPENAI_MAX_RETRIES: '-2' }).maxRetries).toBe(3)
    expect(makeConfig({ OPENAI_MAX_RETRIES: 'many' }).maxRetries).toBe(3)
    expect(makeConfig({ OPENAI_TIMEOUT_MS: '0' }).timeoutMs).toBe(120_000)
  })

  it('never puts the key in a startup log line', () => {
    const config = makeConfig({ OPENAI_API_KEY: 'sk-proj-TESTKEY000011112222' })
    const lines: string[] = []
    jest.spyOn(config['logger'], 'log').mockImplementation(((m: string) => lines.push(m)) as never)
    jest.spyOn(config['logger'], 'error').mockImplementation(((m: string) => lines.push(m)) as never)

    config.logStartupState()

    expect(lines.join(' ')).not.toContain('sk-proj')
    expect(lines.join(' ')).toContain('gpt-5-nano')
  })
})
