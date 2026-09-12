import { Logger } from '@nestjs/common'
import { AiPermanentError, AiTransientError, classifyFailure } from './errors'

// The retry policy every vendor client shares. Extracted from OpenAiClient when
// a second transport (chat-completions) appeared, so timeouts, backoff, error
// classification and log redaction stay implemented exactly once.

// Capped so a 3-retry chain never holds a request open much longer than the
// configured timeout.
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 8000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface RetryContext {
  // Short, non-sensitive label used for logs ('ai-content:blog_article').
  operation: string
  // Attempts *after* the first one. 0 means "no retry", used when an outer
  // scheduler (BullMQ) already owns the retry policy.
  retries: number
  logger: Logger
  // Values masked out of every logged message — the configured API key, in case
  // the vendor echoes it back in an error body.
  secrets: string[]
}

// Only transient failures (429, 5xx, timeout, socket reset) are retried; a
// permanent one (bad key, content filter, unparsable output) surfaces
// immediately because another attempt would change nothing.
export async function withRetry<T>(context: RetryContext, attempt: () => Promise<T>): Promise<T> {
  const started = Date.now()
  let lastError: unknown

  for (let n = 1; n <= context.retries + 1; n++) {
    try {
      const result = await attempt()
      if (n > 1) {
        context.logger.log(
          `[${context.operation}] succeeded on attempt ${n}/${context.retries + 1} in ${Date.now() - started}ms`,
        )
      }
      return result
    } catch (err) {
      lastError = err
      // classifyFailure redacts anything credential-shaped; the configured key
      // is masked explicitly on top of that.
      const failure = classifyFailure(err, context.secrets)
      const requestId = extractRequestId(err)
      const line =
        `[${context.operation}] attempt ${n}/${context.retries + 1} failed ` +
        `(code=${failure.code}${requestId ? `, requestId=${requestId}` : ''}, ${Date.now() - started}ms)`

      if (failure.kind === 'permanent' || n > context.retries) {
        context.logger.error(`${line}: ${failure.message}`)
        break
      }
      context.logger.warn(`${line}: ${failure.message} — retrying`)
      await sleep(Math.min(BASE_BACKOFF_MS * 2 ** (n - 1), MAX_BACKOFF_MS))
    }
  }

  // Re-thrown as-is when it is already a domain error, so ai-content's
  // transient/permanent handling keeps working unchanged.
  if (lastError instanceof AiPermanentError || lastError instanceof AiTransientError) throw lastError
  const failure = classifyFailure(lastError, context.secrets)
  throw failure.kind === 'transient'
    ? new AiTransientError(failure.code, failure.message)
    : new AiPermanentError(failure.code, failure.message)
}

// Vendors return a request id on API errors; it is the handle support asks for,
// and it carries no user content, so it is safe to log.
export function extractRequestId(err: unknown): string | null {
  const candidate = err as { requestID?: unknown; request_id?: unknown }
  const id = candidate?.requestID ?? candidate?.request_id
  return typeof id === 'string' && id.length > 0 ? id : null
}
