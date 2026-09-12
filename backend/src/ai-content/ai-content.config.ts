import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiConfig } from '../ai/ai.config'
import { AI_VENDOR_NAMES, AI_VENDORS } from '../ai/providers/registry'

// Every AI-content knob lives here so the rest of the module never reads
// process.env directly. Vendor credentials are not among them: which vendor
// runs a generation is decided at call time by AiSettingsService, so this class
// only needs to know whether *any* vendor is usable.
@Injectable()
export class AiContentConfig {
  private readonly logger = new Logger(AiContentConfig.name)

  constructor(
    private readonly config: ConfigService,
    private readonly ai: AiConfig,
  ) {}

  get enabled(): boolean {
    return this.config.get<string>('AI_CONTENT_ENABLED') === 'true'
  }

  // The boot default, used for startup logging and as the value a generation
  // falls back to. The model a job actually runs on is resolved per job from
  // the admin setting, so this is not the last word.
  get model(): string {
    return this.ai.defaultModelFor(this.ai.provider)
  }

  // Hard ceiling a single campaign may schedule per local day, whatever the
  // admin typed into dailyTarget.
  get dailyMaxPerCampaign(): number {
    return this.positiveInt('AI_DAILY_MAX_PER_CAMPAIGN', 100)
  }

  // BullMQ worker concurrency. Stays at 1 on purpose: generations are meant to
  // be spread over the day, never fired as a burst.
  get workerConcurrency(): number {
    return this.positiveInt('AI_WORKER_CONCURRENCY', 1)
  }

  get defaultIntervalMinutes(): number {
    return this.positiveInt('AI_DEFAULT_INTERVAL_MINUTES', 20)
  }

  get maxAttempts(): number {
    return this.positiveInt('AI_MAX_ATTEMPTS', 3)
  }

  get requestTimeoutMs(): number {
    return this.positiveInt('AI_REQUEST_TIMEOUT_MS', 120_000)
  }

  // Optional USD-per-million-token overrides; when unset the built-in price
  // table for the configured model is used.
  get priceOverride(): { input: number; output: number } | null {
    // Blank must mean "unset", not zero. docker-compose passes these through as
    // empty strings when the operator leaves them out, and Number('') is 0 —
    // which is finite, so the old check accepted it and silently forced every
    // estimated cost in the panel to $0.00.
    const raw = (key: string): number => {
      const value = this.config.get<string>(key)?.trim()
      return value ? Number(value) : NaN
    }
    const input = raw('AI_COST_INPUT_PER_MTOK')
    const output = raw('AI_COST_OUTPUT_PER_MTOK')
    if (!Number.isFinite(input) || !Number.isFinite(output)) return null
    return { input, output }
  }

  // Masked out of every error message written to the database or to Sentry.
  // Covers all vendors, not just the active one: the operator may switch while
  // a job is in flight.
  get secrets(): string[] {
    return this.ai.allKeys()
  }

  // Feature flag + credential sanity. Returns the reason the feature is
  // unusable, or null when everything is in place. Deliberately checks that at
  // least one vendor has a key rather than a specific one: the operator may
  // have pointed the panel at any of them.
  unavailableReason(): string | null {
    if (!this.enabled) return 'AI content generation is disabled (AI_CONTENT_ENABLED is not "true")'
    if (this.ai.configuredVendors().length === 0) {
      const vars = AI_VENDOR_NAMES.map(name => AI_VENDORS[name].apiKeyEnv).join(', ')
      return `No AI provider key is set while AI_CONTENT_ENABLED=true (looked for ${vars})`
    }
    return null
  }

  logStartupState(): void {
    const reason = this.unavailableReason()
    if (!reason) {
      this.logger.log(`AI content generation enabled (model=${this.model}, concurrency=${this.workerConcurrency})`)
    } else if (this.enabled) {
      // Enabled but unusable is a misconfiguration the admin has to see.
      this.logger.error(`AI content generation cannot start: ${reason}`)
    } else {
      this.logger.log('AI content generation disabled — scheduler and worker are not started')
    }
  }

  private positiveInt(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key))
    return Number.isInteger(raw) && raw > 0 ? raw : fallback
  }
}
