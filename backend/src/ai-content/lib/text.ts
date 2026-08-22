// Topic normalisation and near-duplicate detection. Kept dependency-free and
// pure so the rules can be pinned by unit tests.

const LATIN_EXTRAS: Record<string, string> = {
  ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ş: 's', Ş: 's', ø: 'o', Ø: 'o', æ: 'ae', Æ: 'ae', ß: 'ss', đ: 'd', Đ: 'd', ł: 'l', Ł: 'l',
}

// Two titles at or above this Dice score are treated as the same subject.
// Raising it lets closer variations through; lowering it starves the campaign.
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.72

// lowercase → transliterate → strip accents → drop punctuation → collapse spaces
export function normalizeTopic(value: string): string {
  return value
    .replace(/[ıİğĞşŞøØæÆßđĐłŁ]/g, ch => LATIN_EXTRAS[ch] ?? ch)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Slug candidate derived from a free-form title. Always matches the
// /^[a-z0-9-]+$/ shape the blog DTO enforces.
export function slugifyTopic(value: string, maxLength = 180): string {
  const slug = normalizeTopic(value).replace(/\s/g, '-').replace(/-+/g, '-')
  return slug.slice(0, maxLength).replace(/^-+|-+$/g, '')
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value} `
  const out = new Set<string>()
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3))
  return out
}

// Sørensen–Dice on character trigrams: catches reorderings and small edits
// ("Easy Chicken Tacos" vs "Chicken Tacos, Easy") that exact equality misses.
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const left = trigrams(a)
  const right = trigrams(b)
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const gram of left) if (right.has(gram)) shared++
  return (2 * shared) / (left.size + right.size)
}

export interface DuplicateVerdict {
  duplicate: boolean
  matched?: string
  score?: number
}

// `existing` is expected to hold already-normalised titles/slugs-as-words.
export function findDuplicate(
  candidate: string,
  existing: Iterable<string>,
  threshold = DUPLICATE_SIMILARITY_THRESHOLD,
): DuplicateVerdict {
  const normalized = normalizeTopic(candidate)
  if (!normalized) return { duplicate: true, matched: '', score: 1 }
  let best: DuplicateVerdict = { duplicate: false }
  for (const other of existing) {
    if (!other) continue
    const score = normalized === other ? 1 : similarity(normalized, other)
    if (score >= threshold && (best.score === undefined || score > best.score)) {
      best = { duplicate: true, matched: other, score }
    }
  }
  return best
}

// Slugs are stored with dashes; comparing them as words keeps a slug and the
// title it came from in the same space.
export function slugToWords(slug: string): string {
  return normalizeTopic(slug.replace(/-+/g, ' '))
}

// Rough word count of an HTML body, used to sanity-check generated length.
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}
