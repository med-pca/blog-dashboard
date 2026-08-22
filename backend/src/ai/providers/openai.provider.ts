import { Injectable } from '@nestjs/common'
import { AiConfig } from '../ai.config'
import { OpenAiClient } from '../openai.client'
import type { AiJsonRequest, AiJsonResult, AiProvider, AiTextRequest } from '../ai-provider.types'

// Default provider. Holds no vendor logic of its own — it maps the neutral
// request shapes onto the shared client and fills in configured defaults.
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai'

  constructor(
    private readonly client: OpenAiClient,
    private readonly config: AiConfig,
  ) {}

  generateJson<T>(request: AiJsonRequest): Promise<AiJsonResult<T>> {
    return this.client.respondJson<T>({
      operation: request.operation,
      model: request.model ?? this.config.model,
      timeoutMs: request.timeoutMs ?? this.config.timeoutMs,
      maxOutputTokens: request.maxOutputTokens,
      instructions: request.instructions,
      input: request.input,
      schemaName: request.schemaName,
      schema: request.schema,
      retries: request.retries,
    })
  }

  generateText(request: AiTextRequest): Promise<string> {
    return this.client.respondText({
      operation: request.operation,
      model: request.model ?? this.config.model,
      timeoutMs: request.timeoutMs ?? this.config.timeoutMs,
      maxOutputTokens: request.maxOutputTokens,
      instructions: request.instructions,
      // The Responses API takes the turn history directly; roles map 1:1.
      input: request.messages.map(message => ({ role: message.role, content: message.content })),
      retries: request.retries,
    })
  }
}
