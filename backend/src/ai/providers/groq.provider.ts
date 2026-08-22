import { Injectable, Logger } from '@nestjs/common'
import { GroqService, GROQ_MODEL } from '../../groq/groq.service'
import { AiPermanentError, AiTransientError } from '../errors'
import type { AiJsonRequest, AiJsonResult, AiProvider, AiTextRequest } from '../ai-provider.types'

// TEMPORARY legacy adapter, reachable only with AI_PROVIDER=groq. It exists so
// the migration stays reversible during validation; it is not maintained
// alongside the OpenAI path and is expected to be deleted (together with
// src/groq/ and the GROQ_* variables) once OpenAI is confirmed in production.
//
// Groq's chat-completions endpoint has no strict Structured Outputs, so
// generateJson falls back to json_object mode plus brace extraction — the
// behaviour this codebase had before the migration.
@Injectable()
export class GroqProvider implements AiProvider {
  readonly name = 'groq'
  private readonly logger = new Logger(GroqProvider.name)

  constructor(private readonly groq: GroqService) {}

  async generateJson<T>(request: AiJsonRequest): Promise<AiJsonResult<T>> {
    const content = await this.call(request.operation, 'parse', request.instructions, [
      { role: 'user', content: request.input },
    ], request.maxOutputTokens, { response_format: { type: 'json_object' } })

    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new AiPermanentError('INVALID_JSON', 'Model response contained no JSON object')

    let value: T
    try {
      value = JSON.parse(match[0]) as T
    } catch {
      this.logger.warn(`[${request.operation}] model returned unparsable JSON (${match[0].length} chars)`)
      throw new AiPermanentError('INVALID_JSON', 'Model response was not valid JSON')
    }
    if (value === null || typeof value !== 'object') {
      throw new AiPermanentError('INVALID_JSON', 'Model response was not a JSON object')
    }
    // Groq's usage block is not surfaced by GroqService; callers only use this
    // for cost reporting on the OpenAI path.
    return { value, usage: { inputTokens: 0, outputTokens: 0 } }
  }

  async generateText(request: AiTextRequest): Promise<string> {
    return this.call(
      request.operation,
      'chat',
      request.instructions,
      request.messages,
      request.maxOutputTokens,
      { temperature: 0.3 },
    )
  }

  private async call(
    operation: string,
    purpose: 'chat' | 'parse',
    instructions: string,
    messages: { role: string; content: string }[],
    maxTokens: number,
    extra: Record<string, unknown>,
  ): Promise<string> {
    const keys = this.groq.getKeys(purpose)
    if (!keys.length) {
      throw new AiPermanentError('MISSING_API_KEY', 'No Groq key configured for AI_PROVIDER=groq')
    }

    const { res, data } = await this.groq.call(keys, {
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: instructions }, ...messages],
      max_tokens: maxTokens,
      ...extra,
    })

    const content = data?.choices?.[0]?.message?.content
    if (!res?.ok) {
      const status = res?.status
      this.logger.error(`[${operation}] upstream rejected the request (status=${status ?? 'network error'})`)
      if (status === 401 || status === 403) throw new AiPermanentError('AUTH_REJECTED', 'Upstream rejected the credentials')
      throw new AiTransientError('UPSTREAM_UNAVAILABLE', `Upstream returned ${status ?? 'a network error'}`)
    }
    if (typeof content !== 'string' || !content.trim()) {
      throw new AiPermanentError('EMPTY_RESPONSE', 'Model returned no output text')
    }
    return content.trim()
  }
}
