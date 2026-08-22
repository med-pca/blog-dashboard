// Error taxonomy for a generation run plus the redaction applied before an
// error is ever written to ai_generation_jobs, app_logs or Sentry.

export type AiFailureKind = 'transient' | 'permanent'

// Transient: worth another attempt with backoff (rate limit, upstream 5xx,
// timeout, socket reset). Permanent: retrying changes nothing (bad config,
// unparsable output, topic space exhausted).
export class AiGenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly kind: AiFailureKind,
  ) {
    super(message)
    this.name = 'AiGenerationError'
  }
}

export class AiPermanentError extends AiGenerationError {
  constructor(code: string, message: string) {
    super(code, message, 'permanent')
  }
}

export class AiTransientError extends AiGenerationError {
  constructor(code: string, message: string) {
    super(code, message, 'transient')
  }
}

const MESSAGE_LIMIT = 1000

// Anything that looks like a credential is masked. The exact configured key is
// masked separately by `redactSecrets(text, extraSecrets)` so a provider that
// echoes it back in an error body cannot land in the database.
const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{6,}/g,
  /\b(?:gsk|xai|hf|ghp|glpat)[-_][A-Za-z0-9_-]{6,}/gi,
  /\bBearer\s+[A-Za-z0-9._-]{6,}/gi,
  /\b(authorization|api[-_]?key|apikey|access[-_]?token|password|secret|token)\b(\s*[:=]\s*|"\s*:\s*")["']?[^\s"',}]+/gi,
]

export function redactSecrets(text: string, extraSecrets: string[] = []): string {
  let out = text
  for (const secret of extraSecrets) {
    if (typeof secret === 'string' && secret.length >= 8) {
      out = out.split(secret).join('[REDACTED]')
    }
  }
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, match => {
      const separator = match.match(/(\s*[:=]\s*|"\s*:\s*")/)
      if (!separator) return '[REDACTED]'
      const head = match.slice(0, match.indexOf(separator[0]) + separator[0].length)
      return `${head}[REDACTED]`
    })
  }
  return out
}

export interface ClassifiedFailure {
  kind: AiFailureKind
  code: string
  message: string
}

interface HttpLikeError {
  status?: unknown
  code?: unknown
  name?: unknown
  message?: unknown
}

const TRANSIENT_CODES = new Set([
  'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN', 'ENOTFOUND', 'ERR_CANCELED', 'UND_ERR_CONNECT_TIMEOUT',
])

// Maps whatever the SDK, the network stack or our own validation threw onto a
// stable {kind, code, message} triple. Duck-typed on `status`/`code` so tests
// can hand it a plain object without constructing SDK error classes.
export function classifyFailure(err: unknown, extraSecrets: string[] = []): ClassifiedFailure {
  if (err instanceof AiGenerationError) {
    return { kind: err.kind, code: err.code, message: safeMessage(err.message, extraSecrets) }
  }

  const candidate = (err ?? {}) as HttpLikeError
  const message = safeMessage(
    typeof candidate.message === 'string' ? candidate.message : String(err),
    extraSecrets,
  )
  const status = typeof candidate.status === 'number' ? candidate.status : undefined
  const code = typeof candidate.code === 'string' ? candidate.code : undefined
  const name = typeof candidate.name === 'string' ? candidate.name : ''

  if (status === 429) return { kind: 'transient', code: 'RATE_LIMITED', message }
  if (status !== undefined && status >= 500) return { kind: 'transient', code: `UPSTREAM_${status}`, message }
  if (status === 401 || status === 403) return { kind: 'permanent', code: 'AUTH_REJECTED', message }
  if (status !== undefined && status >= 400) return { kind: 'permanent', code: `REQUEST_REJECTED_${status}`, message }

  if (name === 'AbortError' || name === 'TimeoutError' || name === 'APIConnectionTimeoutError') {
    return { kind: 'transient', code: 'TIMEOUT', message }
  }
  if (name === 'APIConnectionError') return { kind: 'transient', code: 'CONNECTION', message }
  if (code && TRANSIENT_CODES.has(code)) return { kind: 'transient', code, message }
  if (/timed?\s?out/i.test(message)) return { kind: 'transient', code: 'TIMEOUT', message }

  return { kind: 'permanent', code: 'UNEXPECTED', message }
}

function safeMessage(message: string, extraSecrets: string[]): string {
  return redactSecrets(message, extraSecrets).slice(0, MESSAGE_LIMIT)
}
