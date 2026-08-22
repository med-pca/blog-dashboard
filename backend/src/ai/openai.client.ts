import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { AiConfig } from './ai.config'
import { AiPermanentError, AiTransientError, classifyFailure } from './errors'
import type { AiJsonResult, AiUsage } from './ai-provider.types'

// The ONLY place in the codebase that talks to the OpenAI SDK. Every feature
// reaches the vendor through here, so timeouts, retries, error classification
// and log redaction are implemented once.

interface RespondOptions {
  operation: string
  model: string
  timeoutMs: number
  maxOutputTokens: number
  instructions: string
  input: string | OpenAI.Responses.ResponseInput
  retries: number
  // Present for structured generation, absent for free-form text.
  schemaName?: string
  schema?: Record<string, unknown>
}

// Backoff between transient retries. Capped so a 3-retry chain never holds a
// request open much longer than the configured timeout.
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 8000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// gpt-5* and o-series bill reasoning tokens; older chat models reject the param.
export function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o[134])/.test(model)
}

// Reasoning tokens are drawn from the same max_output_tokens budget as the
// visible answer, so a caller asking for 8 tokens of prose would always come
// back `incomplete`. Give reasoning models room to think on top of the ask.
const REASONING_HEADROOM_TOKENS = 2000

@Injectable()
export class OpenAiClient {
  private readonly logger = new Logger(OpenAiClient.name)
  private client: OpenAI | null = null

  constructor(private readonly config: AiConfig) {}

  // Lazily built so a backend booted without AI features never needs a key, and
  // so a key rotated in the environment is picked up on the next call.
  private getClient(): OpenAI {
    const apiKey = this.config.apiKey
    if (!apiKey) {
      throw new AiPermanentError('MISSING_API_KEY', 'OPENAI_API_KEY is not configured')
    }
    if (!this.client) {
      // Retries are owned by this class so every attempt is logged with its
      // operation, status and attempt number.
      this.client = new OpenAI({ apiKey, maxRetries: 0 })
    }
    return this.client
  }

  async respondJson<T>(options: Omit<RespondOptions, 'retries'> & { retries?: number }): Promise<AiJsonResult<T>> {
    const { text, usage } = await this.respondWithRetry({
      ...options,
      retries: options.retries ?? this.config.maxRetries,
    })

    let value: T
    try {
      value = JSON.parse(text) as T
    } catch {
      // The body may echo prompt fragments, so it never reaches the log intact.
      this.logger.warn(`[${options.operation}] model returned unparsable JSON (${text.length} chars)`)
      throw new AiPermanentError('INVALID_JSON', 'Model response was not valid JSON')
    }
    if (value === null || typeof value !== 'object') {
      throw new AiPermanentError('INVALID_JSON', 'Model response was not a JSON object')
    }
    return { value, usage }
  }

  async respondText(options: Omit<RespondOptions, 'retries' | 'schema' | 'schemaName'> & { retries?: number }): Promise<string> {
    const { text } = await this.respondWithRetry({
      ...options,
      retries: options.retries ?? this.config.maxRetries,
    })
    return text
  }

  // Retry loop. Only transient failures (429, 5xx, timeout, socket reset) are
  // retried; a permanent one (bad key, content filter, unparsable output)
  // surfaces immediately because another attempt would change nothing.
  private async respondWithRetry(options: RespondOptions): Promise<{ text: string; usage: AiUsage }> {
    const started = Date.now()
    let lastError: unknown

    for (let attempt = 1; attempt <= options.retries + 1; attempt++) {
      try {
        const result = await this.respondOnce(options)
        if (attempt > 1) {
          this.logger.log(
            `[${options.operation}] succeeded on attempt ${attempt}/${options.retries + 1} in ${Date.now() - started}ms`,
          )
        }
        return result
      } catch (err) {
        lastError = err
        // classifyFailure redacts anything credential-shaped, and the configured
        // key is masked explicitly in case the vendor echoes it back.
        const failure = classifyFailure(err, [this.config.apiKey])
        const requestId = extractRequestId(err)
        const context =
          `[${options.operation}] attempt ${attempt}/${options.retries + 1} failed ` +
          `(code=${failure.code}${requestId ? `, requestId=${requestId}` : ''}, ${Date.now() - started}ms)`

        if (failure.kind === 'permanent' || attempt > options.retries) {
          this.logger.error(`${context}: ${failure.message}`)
          break
        }
        this.logger.warn(`${context}: ${failure.message} — retrying`)
        await sleep(Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS))
      }
    }

    // Re-thrown as-is when it is already a domain error, so ai-content's
    // transient/permanent handling keeps working exactly as before.
    if (lastError instanceof AiPermanentError || lastError instanceof AiTransientError) throw lastError
    const failure = classifyFailure(lastError, [this.config.apiKey])
    throw failure.kind === 'transient'
      ? new AiTransientError(failure.code, failure.message)
      : new AiPermanentError(failure.code, failure.message)
  }

  private async respondOnce(options: RespondOptions): Promise<{ text: string; usage: AiUsage }> {
    const client = this.getClient()
    const reasoning = isReasoningModel(options.model)
    const maxOutputTokens = reasoning
      ? options.maxOutputTokens + REASONING_HEADROOM_TOKENS
      : options.maxOutputTokens

    const response = await client.responses.create(
      {
        model: options.model,
        instructions: options.instructions,
        input: options.input,
        max_output_tokens: maxOutputTokens,
        // Reasoning models bill thinking tokens; "low" keeps everyday use
        // affordable without visibly hurting quality.
        ...(reasoning ? { reasoning: { effort: 'low' as const } } : {}),
        ...(options.schema
          ? {
              text: {
                format: {
                  type: 'json_schema' as const,
                  name: options.schemaName ?? 'response',
                  strict: true,
                  schema: options.schema,
                },
              },
            }
          : {}),
      },
      { timeout: options.timeoutMs },
    )

    const usage: AiUsage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    }

    if (response.status === 'incomplete') {
      const reason = response.incomplete_details?.reason ?? 'unknown'
      // Hitting the token ceiling is worth another attempt; a content filter is not.
      if (reason === 'max_output_tokens') {
        throw new AiTransientError('OUTPUT_TRUNCATED', 'Model output hit the token ceiling before finishing')
      }
      throw new AiPermanentError('RESPONSE_INCOMPLETE', `Model stopped early: ${reason}`)
    }

    const text = response.output_text?.trim() ?? ''
    if (!text) throw new AiPermanentError('EMPTY_RESPONSE', 'Model returned no output text')

    return { text, usage }
  }
}

// OpenAI returns a request id on API errors; it is the handle support asks for,
// and it carries no user content, so it is safe to log.
function extractRequestId(err: unknown): string | null {
  const candidate = err as { requestID?: unknown; request_id?: unknown }
  const id = candidate?.requestID ?? candidate?.request_id
  return typeof id === 'string' && id.length > 0 ? id : null
}
