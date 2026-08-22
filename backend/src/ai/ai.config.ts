import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type AiProviderName = 'openai' | 'groq'

// Every knob of the shared AI call layer lives here so no other file reads
// process.env for a model vendor. The API key is exposed through a getter that
// only OpenAiClient calls — it is never returned by a controller, never put in
// a log line and never sent to the frontend.
@Injectable()
export class AiConfig {
  private readonly logger = new Logger(AiConfig.name)

  constructor(private readonly config: ConfigService) {}

  // Temporary migration switch. OpenAI is the default; AI_PROVIDER=groq brings
  // the legacy adapter back without a code change, and can be dropped once the
  // OpenAI path is validated in production.
  get provider(): AiProviderName {
    return this.config.get<string>('AI_PROVIDER')?.trim().toLowerCase() === 'groq' ? 'groq' : 'openai'
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

  logStartupState(): void {
    if (this.provider === 'groq') {
      this.logger.warn('AI_PROVIDER=groq — legacy Groq adapter active; OpenAI is the supported default')
      return
    }
    if (!this.apiKey) {
      this.logger.error('AI_PROVIDER=openai but OPENAI_API_KEY is not set — AI features will fail closed')
      return
    }
    this.logger.log(`AI provider: openai (model=${this.model}, timeout=${this.timeoutMs}ms, retries=${this.maxRetries})`)
  }

  private positiveInt(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key))
    return Number.isInteger(raw) && raw > 0 ? raw : fallback
  }
}
