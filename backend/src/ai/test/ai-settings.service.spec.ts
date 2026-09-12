import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { AppSetting } from '../../instagram-token/app-setting.entity'
import { AiConfig } from '../ai.config'
import { AiSettingsService } from '../ai-settings.service'

const OPENAI_KEY = 'sk-proj-TESTKEY000011112222333344445555'
const QWEN_KEY = 'sk-ws-TESTKEY000011112222333344445555'

// A one-row app_settings double: the service only ever reads and writes the
// single 'ai_provider_settings' key.
function makeRepo(stored: string | null = null) {
  const state = { value: stored }
  const repo = {
    findOne: jest.fn(async () => (state.value === null ? null : { key: 'ai_provider_settings', value: state.value })),
    save: jest.fn(async (row: { value: string }) => {
      state.value = row.value
      return row
    }),
  } as unknown as Repository<AppSetting>
  return { repo, state }
}

function makeService(env: Record<string, string> = {}, stored: string | null = null) {
  const config = new ConfigService()
  jest.spyOn(config, 'get').mockImplementation(((key: string) => env[key]) as never)
  const { repo, state } = makeRepo(stored)
  return { service: new AiSettingsService(repo, new AiConfig(config)), repo, state }
}

describe('AiSettingsService.get', () => {
  it('starts on the AI_PROVIDER seed when nothing has been chosen yet', async () => {
    const { service } = makeService({ AI_PROVIDER: 'qwen', QWEN_API_KEY: QWEN_KEY })
    expect(await service.get()).toEqual({ provider: 'qwen', model: '' })
  })

  it('reads a stored choice back', async () => {
    const { service } = makeService(
      { GEMINI_API_KEY: 'AQ.TESTKEY000011112222' },
      JSON.stringify({ provider: 'gemini', model: 'gemini-3.1-flash-lite' }),
    )
    expect(await service.get()).toEqual({ provider: 'gemini', model: 'gemini-3.1-flash-lite' })
  })

  it('falls back to the seed rather than trusting an unknown vendor name', async () => {
    const { service } = makeService({ OPENAI_API_KEY: OPENAI_KEY }, JSON.stringify({ provider: 'anthropic', model: 'x' }))
    expect((await service.get()).provider).toBe('openai')
  })

  it('survives a corrupted row instead of taking the chatbot down', async () => {
    const { service } = makeService({ OPENAI_API_KEY: OPENAI_KEY }, '{ this is not json')
    expect((await service.get()).provider).toBe('openai')
  })
})

describe('AiSettingsService.resolve', () => {
  it('fills in the vendor default when no model was typed', async () => {
    const { service } = makeService({ QWEN_API_KEY: QWEN_KEY }, JSON.stringify({ provider: 'qwen', model: '' }))
    expect(await service.resolve()).toEqual({ provider: 'qwen', model: 'qwen3.8-flash', fallbackReason: null })
  })

  it('honours an explicit model over the vendor default', async () => {
    const { service } = makeService(
      { QWEN_API_KEY: QWEN_KEY },
      JSON.stringify({ provider: 'qwen', model: 'deepseek-v4-pro-0813' }),
    )
    expect((await service.resolve()).model).toBe('deepseek-v4-pro-0813')
  })

  it('lets the environment override a registry default', async () => {
    const { service } = makeService(
      { QWEN_API_KEY: QWEN_KEY, QWEN_MODEL: 'qwen3.8-max-0902' },
      JSON.stringify({ provider: 'qwen', model: '' }),
    )
    expect((await service.resolve()).model).toBe('qwen3.8-max-0902')
  })

  // The chatbot is on the public site: a vendor selected before its key was
  // deployed must degrade, not take the site's AI features offline.
  it('falls back to OpenAI when the chosen vendor has no key', async () => {
    const { service } = makeService({ OPENAI_API_KEY: OPENAI_KEY }, JSON.stringify({ provider: 'deepseek', model: '' }))
    const route = await service.resolve()
    expect(route.provider).toBe('openai')
    expect(route.fallbackReason).toMatch(/DEEPSEEK_API_KEY/)
  })

  it('reports the missing variable when there is no fallback either', async () => {
    const { service } = makeService({}, JSON.stringify({ provider: 'gemini', model: '' }))
    const route = await service.resolve()
    expect(route.provider).toBe('gemini')
    expect(route.fallbackReason).toMatch(/GEMINI_API_KEY/)
  })
})

describe('AiSettingsService.update', () => {
  it('persists the choice and re-reads it without the stale cache', async () => {
    const { service, state } = makeService({ OPENAI_API_KEY: OPENAI_KEY, QWEN_API_KEY: QWEN_KEY })
    await service.get() // warms the cache on the seed value

    const view = await service.update({ provider: 'qwen', model: 'qwen3.8-max-0902' })

    expect(JSON.parse(state.value as string)).toEqual({ provider: 'qwen', model: 'qwen3.8-max-0902' })
    expect(view.effectiveProvider).toBe('qwen')
    expect((await service.get()).provider).toBe('qwen')
  })

  // '' is a real instruction — "go back to the vendor default" — so it must not
  // be treated as "field absent" and silently keep the old model.
  it('treats an empty model as a reset, not as an absent field', async () => {
    const { service } = makeService({ QWEN_API_KEY: QWEN_KEY }, JSON.stringify({ provider: 'qwen', model: 'qwen3.8-27b' }))
    const view = await service.update({ model: '' })
    expect(view.model).toBe('')
    expect(view.effectiveModel).toBe('qwen3.8-flash')
  })

  it('never exposes a key through the admin view', async () => {
    const { service } = makeService({ OPENAI_API_KEY: OPENAI_KEY, QWEN_API_KEY: QWEN_KEY })
    const view = await service.view()
    expect(JSON.stringify(view)).not.toContain(OPENAI_KEY)
    expect(JSON.stringify(view)).not.toContain(QWEN_KEY)
    expect(view.vendors.find(v => v.name === 'qwen')?.keyConfigured).toBe(true)
    expect(view.vendors.find(v => v.name === 'deepseek')?.keyConfigured).toBe(false)
  })
})
