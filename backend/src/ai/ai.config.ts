import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AI_VENDOR_NAMES, AI_VENDORS, FALLBACK_VENDOR, isAiVendorName, type AiVendorName } from './providers/registry'

// Kept as an alias so existing importers keep compiling; the registry is now
// the source of truth for which vendors exist.
export type AiProviderName = AiVendorName

// Every knob of the shared AI call layer lives here so no other file reads
// process.env for a model vendor. API keys are exposed through getters that
// only the clients call — they are never returned by a controller, never put in
// a log line and never sent to the frontend.
@Injectable()
export class AiConfig {
  private readonly logger = new Logger(AiConfig.name)

  constructor(private readonly config: ConfigService) {}

  // Seed value only. Which vendor actually serves a request is decided per call
  // by AiRoutingProvider from the admin setting in the database; AI_PROVIDER is
  // what a deployment starts on before anyone has chosen anything.
  get provider(): AiVendorName {
    const raw = this.config.get<string>('AI_PROVIDER')?.trim().toLowerCase()
    return isAiVendorName(raw) ? raw : FALLBACK_VENDOR
  }

  // ── Per-vendor lookups, all driven by the registry table ──

  // '' when unset, so a caller fails with a clear domain error instead of
  // leaking an undefined into an Authorization header.
  keyFor(name: AiVendorName): string {
    return this.config.get<string>(AI_VENDORS[name].apiKeyEnv)?.trim() ?? ''
  }

  // A vendor with no credential cannot be routed to, which is what lets the
  // router fall back instead of failing a public request.
  hasKey(name: AiVendorName): boolean {
    return this.keyFor(name) !== ''
  }

  baseUrlFor(name: AiVendorName): string | null {
    return this.config.get<string>(AI_VENDORS[name].baseUrlEnv)?.trim() || AI_VENDORS[name].baseUrl
  }

  // The model used when the admin left the field blank.
  defaultModelFor(name: AiVendorName): string {
    return this.config.get<string>(AI_VENDORS[name].modelEnv)?.trim() || AI_VENDORS[name].defaultModel
  }

  configuredVendors(): AiVendorName[] {
    return AI_VENDOR_NAMES.filter(name => this.hasKey(name))
  }

  // Every credential currently in the environment. Passed to redactSecrets so a
  // vendor that echoes its key back in an error body cannot land in app_logs,
  // ai_generation_jobs or Sentry — whichever vendor happens to be active.
  allKeys(): string[] {
    return AI_VENDOR_NAMES.map(name => this.keyFor(name)).filter(key => key !== '')
  }

  get model(): string {
    return this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-5-nano'
  }

  get timeoutMs(): number {
    return this.positiveInt('OPENAI_TIMEOUT_MS', 120_000)
  }

  // Attempts *after* the first one, applied to transient failures only.
  get maxRetries(): number {
    const raw = Number(this.config.get<string>('OPENAI_MAX_RETRIES'))
    return Number.isInteger(raw) && raw >= 0 ? raw : 3
  }

  // Read only by OpenAiClient. Returns '' when unset so callers fail with a
  // clear domain error instead of leaking an undefined into the SDK.
  get apiKey(): string {
    return this.config.get<string>('OPENAI_API_KEY')?.trim() ?? ''
  }

  get imageEnabled(): boolean { return this.config.get<string>('AI_IMAGE_ENABLED') === 'true' }
  get imageModel(): string { return this.config.get<string>('OPENAI_IMAGE_MODEL')?.trim() || 'gpt-image-2' }
  get imageSize(): '1024x1024' | '1536x1024' | '1024x1536' {
    const value = this.config.get<string>('AI_IMAGE_SIZE')
    return value === '1024x1024' || value === '1024x1536' ? value : '1536x1024'
  }
  get imageQuality(): 'low' | 'medium' | 'high' | 'auto' {
    const value = this.config.get<string>('AI_IMAGE_QUALITY')
    return value === 'low' || value === 'high' || value === 'auto' ? value : 'medium'
  }

  logStartupState(): void {
    const configured = this.configuredVendors()
    if (configured.length === 0) {
      this.logger.error(
        `No AI credential found (looked for ${AI_VENDOR_NAMES.map(n => AI_VENDORS[n].apiKeyEnv).join(', ')}) — AI features will fail closed`,
      )
      return
    }

    const seed = this.provider
    this.logger.log(
      `AI vendors with a key: ${configured.join(', ')} — boot default ${seed} ` +
        `(model=${this.defaultModelFor(seed)}, timeout=${this.timeoutMs}ms, retries=${this.maxRetries})`,
    )

    // The admin panel can point at any vendor, so a missing key for one of them
    // is a latent fallback, not an outage. Surfaced once at boot.
    const missing = AI_VENDOR_NAMES.filter(name => name !== 'groq' && !this.hasKey(name))
    if (missing.length > 0) {
      this.logger.warn(
        `Selectable but unusable without a key: ${missing.join(', ')} — choosing one falls back to ${FALLBACK_VENDOR}`,
      )
    }
  }

  private positiveInt(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key))
    return Number.isInteger(raw) && raw > 0 ? raw : fallback
  }
}
