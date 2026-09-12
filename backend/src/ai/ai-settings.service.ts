import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppSetting } from '../instagram-token/app-setting.entity'
import { AiConfig } from './ai.config'
import { FALLBACK_VENDOR, isAiVendorName, AI_VENDORS } from './providers/registry'
import {
  DEFAULT_AI_SETTINGS,
  vendorViews,
  type AiSettings,
  type AiSettingsView,
  type ResolvedVendor,
} from './ai-settings.types'

// Single JSON blob in the existing app_settings key/value table — same approach
// as adsense_settings, so no migration is needed and the whole choice is
// read and written atomically.
const SETTINGS_KEY = 'ai_provider_settings'

// The router asks for the active vendor on every call. Re-reading the row each
// time would put a query in front of every model request, so the value is held
// briefly; a save clears it, which makes a change from the panel effectively
// immediate for the operator who made it.
const CACHE_MS = 30_000

@Injectable()
export class AiSettingsService {
  private readonly logger = new Logger(AiSettingsService.name)
  private cache: { value: AiSettings; at: number } | null = null

  constructor(
    @InjectRepository(AppSetting) private readonly settings: Repository<AppSetting>,
    private readonly config: AiConfig,
  ) {}

  async get(): Promise<AiSettings> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value

    const row = await this.settings.findOne({ where: { key: SETTINGS_KEY } })
    let value: AiSettings
    if (!row?.value) {
      // Nothing chosen yet: start on whatever AI_PROVIDER seeds, so an existing
      // deployment keeps behaving exactly as it did before this feature.
      value = { provider: this.config.provider, model: '' }
    } else {
      try {
        value = this.normalise(JSON.parse(row.value) as Partial<AiSettings>)
      } catch {
        // A hand-edited or truncated row must not take the chatbot down with it.
        this.logger.warn('Stored AI settings are not valid JSON, falling back to defaults')
        value = { ...DEFAULT_AI_SETTINGS, provider: this.config.provider }
      }
    }

    this.cache = { value, at: Date.now() }
    return value
  }

  // The routing decision, fallback included. Called for every model request.
  async resolve(): Promise<ResolvedVendor> {
    const chosen = await this.get()

    if (!this.config.hasKey(chosen.provider)) {
      // Falling back beats failing: the chatbot and the Instagram auto-fill are
      // on the public site, and a vendor picked in the panel before its key was
      // deployed must not take them offline.
      const reason = `${AI_VENDORS[chosen.provider].apiKeyEnv} is not set`
      if (chosen.provider !== FALLBACK_VENDOR && this.config.hasKey(FALLBACK_VENDOR)) {
        return {
          provider: FALLBACK_VENDOR,
          model: this.config.defaultModelFor(FALLBACK_VENDOR),
          fallbackReason: `${chosen.provider} selected but ${reason} — using ${FALLBACK_VENDOR}`,
        }
      }
      // No fallback available either; let the client raise MISSING_API_KEY so
      // the failure names the variable that is missing.
      return { provider: chosen.provider, model: this.effectiveModel(chosen), fallbackReason: reason }
    }

    return { provider: chosen.provider, model: this.effectiveModel(chosen), fallbackReason: null }
  }

  async view(): Promise<AiSettingsView> {
    const stored = await this.get()
    const resolved = await this.resolve()
    return {
      ...stored,
      fallbackReason: resolved.fallbackReason,
      effectiveProvider: resolved.provider,
      effectiveModel: resolved.model,
      vendors: vendorViews(
        name => this.config.hasKey(name),
        name => this.config.defaultModelFor(name),
      ),
    }
  }

  async update(patch: Partial<AiSettings>): Promise<AiSettingsView> {
    const current = await this.get()
    const next = this.normalise({
      provider: patch.provider ?? current.provider,
      // An explicit empty string is meaningful — it means "back to the vendor
      // default" — so it must not be swallowed by ??.
      model: patch.model !== undefined ? patch.model : current.model,
    })

    await this.settings.save({ key: SETTINGS_KEY, value: JSON.stringify(next) })
    this.cache = null
    this.logger.log(`AI provider set to ${next.provider} (model=${next.model || 'vendor default'})`)
    return this.view()
  }

  private effectiveModel(settings: AiSettings): string {
    return settings.model || this.config.defaultModelFor(settings.provider)
  }

  // Keeps the stored shape stable even if a vendor is removed from the registry
  // later, and stops an unknown name from reaching the router.
  private normalise(raw: Partial<AiSettings>): AiSettings {
    const provider = isAiVendorName(raw.provider) ? raw.provider : this.config.provider
    return {
      provider,
      model: typeof raw.model === 'string' ? raw.model.trim().slice(0, 120) : '',
    }
  }
}
