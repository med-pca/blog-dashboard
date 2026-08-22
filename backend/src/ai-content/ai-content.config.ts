import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

// Every AI-content knob lives here so the rest of the module never reads
// process.env directly. The OpenAI key is exposed through a getter that is
// only called by the provider — it is never returned by a controller and never
// interpolated into a log line.
@Injectable()
export class AiContentConfig {
  private readonly logger = new Logger(AiContentConfig.name)

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get<string>('AI_CONTENT_ENABLED') === 'true'
  }

  get model(): string {
    return this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-5-nano'
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
    const input = Number(this.config.get<string>('AI_COST_INPUT_PER_MTOK'))
    const output = Number(this.config.get<string>('AI_COST_OUTPUT_PER_MTOK'))
    if (!Number.isFinite(input) || !Number.isFinite(output)) return null
    return { input, output }
  }

  // Read only by OpenAiContentProvider. Returns '' when unset so callers fail
  // with a clear domain error instead of leaking an undefined into the SDK.
  get apiKey(): string {
    return this.config.get<string>('OPENAI_API_KEY')?.trim() ?? ''
  }

  // Feature flag + key sanity, evaluated once at boot. Returns the reason the
  // feature is unusable, or null when everything is in place.
  unavailableReason(): string | null {
    if (!this.enabled) return 'AI content generation is disabled (AI_CONTENT_ENABLED is not "true")'
    if (!this.apiKey) return 'OPENAI_API_KEY is not set while AI_CONTENT_ENABLED=true'
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
