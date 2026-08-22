import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Guards the security boundary of ÉTAPE 7: every model call happens in the
// backend, and no key ever reaches a bundle, a repo file or a VITE_ variable.
// These are repo-level assertions, so they fail on the commit that breaks them
// rather than in production.

const REPO_ROOT = join(__dirname, '..', '..', '..', '..')
const FRONTEND_SRC = join(REPO_ROOT, 'frontend', 'src')

function tracked(pattern: string, path: string): string[] {
  try {
    // -I skips binary files; a non-zero exit just means "no match".
    return execFileSync('git', ['grep', '-I', '-l', '-i', '-e', pattern, '--', path], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
  } catch {
    return []
  }
}

describe('frontend never talks to OpenAI', () => {
  it('has no OpenAI SDK dependency in the frontend package', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'frontend', 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(deps)).not.toContain('openai')
    expect(Object.keys(deps)).not.toContain('groq-sdk')
  })

  it('never calls the OpenAI API from frontend source', () => {
    expect(tracked('api\\.openai\\.com', 'frontend/src')).toEqual([])
    expect(tracked('api\\.groq\\.com', 'frontend/src')).toEqual([])
  })

  it('never exposes an API key through a VITE_ variable', () => {
    // VITE_ variables are inlined into the bundle and are therefore public.
    expect(tracked('VITE_OPENAI', '.')).toEqual([])
    expect(tracked('VITE_GROQ', '.')).toEqual([])
    expect(tracked('VITE_.*API_KEY', '.')).toEqual([])
  })

  it('has no real-looking API key anywhere in the repository', () => {
    // A real OpenAI key is a long high-entropy string. Documentation ellipses
    // ("sk-proj-...") and the TEST/DUMMY fixtures below the threshold are fine;
    // anything else that long is treated as a leak.
    const KEY_LIKE = /sk-(?:proj-|live-|or-)?[A-Za-z0-9_-]{20,}/g
    // The redaction spec must contain key-shaped strings to be worth anything.
    const ALLOWED = ['backend/src/ai-content/test/errors.spec.ts']
    const offenders: string[] = []

    for (const file of tracked('sk-', '.')) {
      if (ALLOWED.includes(file)) continue
      const content = readFileSync(join(REPO_ROOT, file), 'utf8')
      for (const match of content.match(KEY_LIKE) ?? []) {
        if (/TEST|DUMMY|EXAMPLE|PLACEHOLDER|XXXX/i.test(match)) continue
        offenders.push(`${file}: ${match.slice(0, 12)}…`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('ships no built frontend bundle containing a real key prefix', () => {
    const dist = join(REPO_ROOT, 'frontend', 'dist')
    if (!existsSync(dist)) return // nothing built in this environment
    let hits: string[] = []
    try {
      // grep exits 1 with no output when nothing matches, which is the pass case.
      hits = execFileSync('grep', ['-rlI', '-e', 'sk-proj-', '-e', 'sk-live-', dist], { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean)
    } catch {
      hits = []
    }
    expect(hits).toEqual([])
  })

  it('routes the admin auto-fill through our own backend endpoint', () => {
    const adminApi = readFileSync(join(FRONTEND_SRC, 'api', 'admin.ts'), 'utf8')
    expect(adminApi).toContain('/api/projects/admin/parse-instagram')
  })
})
