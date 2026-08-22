// The one seam between application features and a model vendor. Everything a
// feature needs is expressed on plain objects here, so adding or removing a
// vendor means writing a class under providers/ — never touching a controller,
// a DTO or a frontend call.

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AiRequestBase {
  // Short, non-sensitive label used for logs and metrics ('project-autofill').
  operation: string
  // System-level rules. Never contains user-supplied text.
  instructions: string
  maxOutputTokens: number
  model?: string
  timeoutMs?: number
  // Retries on transient failures. Omit to use OPENAI_MAX_RETRIES; pass 0 when
  // an outer scheduler (BullMQ) already owns the retry policy.
  retries?: number
}

export interface AiJsonRequest extends AiRequestBase {
  // User-supplied content is confined to this field and always treated as data.
  input: string
  schemaName: string
  schema: Record<string, unknown>
}

export interface AiTextRequest extends AiRequestBase {
  messages: AiChatMessage[]
}

export interface AiUsage {
  inputTokens: number
  outputTokens: number
}

export interface AiJsonResult<T> {
  value: T
  usage: AiUsage
}

export interface AiProvider {
  readonly name: string
  // Structured generation. The vendor is asked to satisfy `schema` exactly; the
  // returned object is parsed JSON, still to be domain-validated by the caller.
  generateJson<T>(request: AiJsonRequest): Promise<AiJsonResult<T>>
  // Free-form generation returning plain text.
  generateText(request: AiTextRequest): Promise<string>
}

export const AI_PROVIDER = 'AI_PROVIDER'
