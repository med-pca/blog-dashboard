import { Injectable, Logger } from '@nestjs/common'
import { AiConfig } from '../ai.config'
import { AiSettingsService } from '../ai-settings.service'
import { ChatCompletionsClient } from '../chat-completions.client'
import { OpenAiProvider } from './openai.provider'
import { GroqProvider } from './groq.provider'
import type { AiJsonRequest, AiJsonResult, AiProvider, AiTextRequest } from '../ai-provider.types'

// Bound to the AI_PROVIDER token, so every existing consumer — the chatbot, the
// Instagram auto-fill, the blog generator — goes through here without being
// modified. The vendor is resolved per call rather than at boot, which is what
// lets the admin panel change it without a restart.
@Injectable()
export class AiRoutingProvider implements AiProvider {
  readonly name = 'router'
  private readonly logger = new Logger(AiRoutingProvider.name)
  // A fallback would otherwise log on every single request; only a change of
  // reason is worth a line.
  private lastFallbackReason: string | null = null

  constructor(
    private readonly settings: AiSettingsService,
    private readonly config: AiConfig,
    private readonly openai: OpenAiProvider,
    private readonly groq: GroqProvider,
    private readonly chat: ChatCompletionsClient,
  ) {}

  async generateJson<T>(request: AiJsonRequest): Promise<AiJsonResult<T>> {
    const route = await this.route()
    // A caller that pinned a model keeps it — ai-content resolves the active
    // model once per job so its cost line matches what actually ran.
    const model = request.model ?? route.model

    if (route.provider === 'openai') return this.openai.generateJson<T>({ ...request, model })
    if (route.provider === 'groq') return this.groq.generateJson<T>(request)

    return this.chat.respondJson<T>({
      vendor: route.provider,
      operation: request.operation,
      model,
      timeoutMs: request.timeoutMs ?? this.config.timeoutMs,
      maxOutputTokens: request.maxOutputTokens,
      instructions: request.instructions,
      // User-supplied content stays confined to a user turn, never the system
      // message, exactly as on the Responses path.
      messages: [{ role: 'user', content: request.input }],
      schemaName: request.schemaName,
      schema: request.schema,
      retries: request.retries,
    })
  }

  async generateText(request: AiTextRequest): Promise<string> {
    const route = await this.route()
    const model = request.model ?? route.model

    if (route.provider === 'openai') return this.openai.generateText({ ...request, model })
    if (route.provider === 'groq') return this.groq.generateText(request)

    return this.chat.respondText({
      vendor: route.provider,
      operation: request.operation,
      model,
      timeoutMs: request.timeoutMs ?? this.config.timeoutMs,
      maxOutputTokens: request.maxOutputTokens,
      instructions: request.instructions,
      messages: request.messages,
      retries: request.retries,
    })
  }

  private async route() {
    const route = await this.settings.resolve()
    if (route.fallbackReason !== this.lastFallbackReason) {
      if (route.fallbackReason) this.logger.warn(`AI routing fallback: ${route.fallbackReason}`)
      else this.logger.log(`AI routing restored: ${route.provider} (model=${route.model})`)
      this.lastFallbackReason = route.fallbackReason
    }
    return route
  }
}
