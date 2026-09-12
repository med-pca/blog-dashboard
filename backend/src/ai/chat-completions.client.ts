import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { AiConfig } from './ai.config'
import { AiPermanentError, AiTransientError } from './errors'
import { withRetry } from './retry'
import { AI_VENDORS, type AiVendorName } from './providers/registry'
import type { AiJsonResult, AiUsage } from './ai-provider.types'

// The transport for every vendor that is not OpenAI. Gemini, Qwen and DeepSeek
// all implement the OpenAI-compatible /chat/completions shape, so they differ
// only by baseURL, credential and how strictly they honour a JSON schema — all
// of which come from the registry table.
//
// Kept separate from OpenAiClient rather than merged into it: OpenAI is reached
// through the Responses API, which no other vendor implements, and collapsing
// the two would mean one method branching on the vendor at every step.

interface CompleteOptions {
  vendor: AiVendorName
  operation: string
  model: string
  timeoutMs: number
  maxOutputTokens: number
  instructions: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  retries?: number
  // Present for structured generation, absent for free-form text.
  schemaName?: string
  schema?: Record<string, unknown>
}

// Gemini 3.x, Qwen3.x and DeepSeek's reasoner all bill thinking tokens against
// the same max_tokens budget as the visible answer, and — unlike OpenAI — give
// no way to tell from the model id which ones do. A caller asking for 60 tokens
// of prose therefore came back truncated. The ceiling is a limit rather than a
// target, so granting the headroom unconditionally costs nothing on a model
// that does not think, and prevents a class of silent failure on one that does.
const REASONING_HEADROOM_TOKENS = 2000

@Injectable()
export class ChatCompletionsClient {
  private readonly logger = new Logger(ChatCompletionsClient.name)
  // One SDK instance per vendor, rebuilt when the credential changes so a key
  // rotated in the environment is picked up without a restart.
  private readonly clients = new Map<AiVendorName, { key: string; client: OpenAI }>()

  constructor(private readonly config: AiConfig) {}

  private getClient(name: AiVendorName): OpenAI {
    const apiKey = this.config.keyFor(name)
    if (!apiKey) {
      throw new AiPermanentError('MISSING_API_KEY', `${AI_VENDORS[name].apiKeyEnv} is not configured`)
    }
    const cached = this.clients.get(name)
    if (cached && cached.key === apiKey) return cached.client

    const client = new OpenAI({
      apiKey,
      baseURL: this.config.baseUrlFor(name) ?? undefined,
      // Retries are owned by withRetry so every attempt is logged with its
      // operation, status and attempt number.
      maxRetries: 0,
    })
    this.clients.set(name, { key: apiKey, client })
    return client
  }

  async respondJson<T>(options: CompleteOptions): Promise<AiJsonResult<T>> {
    const { text, usage } = await this.complete(options)

    // Vendors in 'object' JSON mode are not bound to the schema and some wrap
    // the payload in prose or a ``` fence, so the object is extracted rather
    // than parsed from the whole body.
    const source = AI_VENDORS[options.vendor].jsonMode === 'schema' ? text : (text.match(/\{[\s\S]*\}/)?.[0] ?? '')
    if (!source) {
      throw new AiPermanentError('INVALID_JSON', 'Model response contained no JSON object')
    }

    let value: T
    try {
      value = JSON.parse(source) as T
    } catch {
      // The body may echo prompt fragments, so it never reaches the log intact.
      this.logger.warn(`[${options.operation}] model returned unparsable JSON (${source.length} chars)`)
      throw new AiPermanentError('INVALID_JSON', 'Model response was not valid JSON')
    }
    if (value === null || typeof value !== 'object') {
      throw new AiPermanentError('INVALID_JSON', 'Model response was not a JSON object')
    }
    return { value, usage }
  }

  async respondText(options: CompleteOptions): Promise<string> {
    const { text } = await this.complete(options)
    return text
  }

  private complete(options: CompleteOptions): Promise<{ text: string; usage: AiUsage }> {
    const retries = options.retries ?? this.config.maxRetries
    return withRetry(
      {
        operation: options.operation,
        retries,
        logger: this.logger,
        secrets: [this.config.keyFor(options.vendor)],
      },
      () => this.completeOnce(options),
    )
  }

  private async completeOnce(options: CompleteOptions): Promise<{ text: string; usage: AiUsage }> {
    const client = this.getClient(options.vendor)
    const strict = AI_VENDORS[options.vendor].jsonMode === 'schema'

    // A vendor without strict schema support still needs to know the shape it
    // must produce, so the schema is inlined into the system message instead.
    const instructions =
      options.schema && !strict
        ? `${options.instructions}\n\nReturn a single JSON object matching this JSON Schema exactly, with no prose and no code fence:\n${JSON.stringify(options.schema)}`
        : options.instructions

    const response = await client.chat.completions.create(
      {
        model: options.model,
        messages: [{ role: 'system', content: instructions }, ...options.messages],
        max_tokens: options.maxOutputTokens + REASONING_HEADROOM_TOKENS,
        ...(options.schema
          ? {
              response_format: strict
                ? {
                    type: 'json_schema' as const,
                    json_schema: { name: options.schemaName ?? 'response', strict: true, schema: options.schema },
                  }
                : { type: 'json_object' as const },
            }
          : {}),
      },
      { timeout: options.timeoutMs },
    )

    const usage: AiUsage = {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    }

    const choice = response.choices?.[0]
    // Running out of tokens mid-object is worth another attempt; a content
    // filter is not. Same split as OpenAiClient's reading of `incomplete`.
    if (choice?.finish_reason === 'length') {
      throw new AiTransientError('OUTPUT_TRUNCATED', 'Model output hit the token ceiling before finishing')
    }
    if (choice?.finish_reason === 'content_filter') {
      throw new AiPermanentError('RESPONSE_INCOMPLETE', 'Model stopped early: content_filter')
    }

    const text = choice?.message?.content?.trim() ?? ''
    if (!text) throw new AiPermanentError('EMPTY_RESPONSE', 'Model returned no output text')

    return { text, usage }
  }
}
