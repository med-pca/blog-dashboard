import { AiPermanentError, AiTransientError, classifyFailure, redactSecrets } from '../lib/errors'

const KEY = 'sk-proj-AAAABBBBCCCCDDDDEEEEFFFF00001111'

describe('redactSecrets', () => {
  it('masks the configured key wherever it appears', () => {
    expect(redactSecrets(`request failed with key ${KEY} attached`, [KEY])).toBe(
      'request failed with key [REDACTED] attached',
    )
  })

  it('masks credential-shaped strings even when the key is unknown', () => {
    expect(redactSecrets('Incorrect API key provided: sk-proj-ZZZZYYYYXXXX0000')).toContain('[REDACTED]')
    expect(redactSecrets('Incorrect API key provided: sk-proj-ZZZZYYYYXXXX0000')).not.toContain('ZZZZYYYY')
  })

  it('masks Authorization headers and api key assignments while keeping the label', () => {
    const redacted = redactSecrets('headers: {"Authorization":"Bearer abcdef123456","x":1}')
    expect(redacted).not.toContain('abcdef123456')
    expect(redacted).toContain('Authorization')

    const assignment = redactSecrets('OPENAI_API_KEY=sk-live-9999888877776666 password=hunter2000')
    expect(assignment).not.toContain('9999888877776666')
    expect(assignment).not.toContain('hunter2000')
  })

  it('leaves ordinary text alone', () => {
    expect(redactSecrets('Model returned an empty title')).toBe('Model returned an empty title')
  })
})

describe('classifyFailure', () => {
  it('treats a 429 as transient', () => {
    expect(classifyFailure({ status: 429, message: 'Rate limit reached' })).toMatchObject({
      kind: 'transient',
      code: 'RATE_LIMITED',
    })
  })

  it('treats upstream 5xx as transient', () => {
    expect(classifyFailure({ status: 500, message: 'server_error' })).toMatchObject({
      kind: 'transient',
      code: 'UPSTREAM_500',
    })
    expect(classifyFailure({ status: 503, message: 'overloaded' }).kind).toBe('transient')
  })

  it('treats timeouts and dropped sockets as transient', () => {
    expect(classifyFailure({ name: 'APIConnectionTimeoutError', message: 'Request timed out.' })).toMatchObject({
      kind: 'transient',
      code: 'TIMEOUT',
    })
    expect(classifyFailure({ code: 'ECONNRESET', message: 'socket hang up' }).kind).toBe('transient')
  })

  it('treats a rejected key or a bad request as permanent', () => {
    expect(classifyFailure({ status: 401, message: 'Incorrect API key' })).toMatchObject({
      kind: 'permanent',
      code: 'AUTH_REJECTED',
    })
    expect(classifyFailure({ status: 400, message: 'unsupported parameter' }).kind).toBe('permanent')
  })

  it('passes our own errors through with their own classification', () => {
    expect(classifyFailure(new AiPermanentError('INVALID_JSON', 'not JSON'))).toEqual({
      kind: 'permanent',
      code: 'INVALID_JSON',
      message: 'not JSON',
    })
    expect(classifyFailure(new AiTransientError('OUTPUT_TRUNCATED', 'too long')).kind).toBe('transient')
  })

  it('falls back to permanent/UNEXPECTED for anything unrecognised', () => {
    expect(classifyFailure(new Error('boom'))).toEqual({ kind: 'permanent', code: 'UNEXPECTED', message: 'boom' })
  })

  it('redacts the key out of the recorded message', () => {
    const result = classifyFailure({ status: 401, message: `Incorrect API key provided: ${KEY}` }, [KEY])
    expect(result.message).not.toContain(KEY)
    expect(result.message).toContain('[REDACTED]')
  })
})
