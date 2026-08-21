export const INJECTION_PATTERNS = [
  // English instruction override
  /ignore\s+(previous|all|your)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(your|all|previous)\s+(instructions?|rules?|context)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /your\s+new\s+instructions?\s+(are|is)/i,
  /from\s+now\s+on\s+(you|ignore|forget)/i,
  /\bdan\b.*mode/i,
  /jailbreak/i,
  // Turkish instruction override
  /talimatlar[iı]\s*(unut|yoksay|görmezden)/i,
  /kural(lar[iı])?\s*(unut|yoksay|geç|değiştir)/i,
  /sistem\s*(talimat|mesaj|prompt)/i,
  /rol\s*oyna/i,
  /yeni\s*kimli[gğ]/i,
  /[şs]imdi\s+sen\s+(bir|artık)/i,
  /art[iı]k\s+sen\s+(bir|[a-züçşğıöA-ZÜÇŞĞİÖ])/i,
  /yeni\s+rol/i,
  // Llama 3 / ChatML separator token injection
  /<\|[a-z_]+\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<s>|<\/s>/i,
  // NOT: Markdown ayraçları (###, ----, ====) burada ENGELLENMEZ, sanitizeContent'te
  // temizlenir. Model cevabında ayraç üretirse geçmişteki o mesaj sonraki tüm
  // istekleri 400'e düşürüyordu (konuşma kalıcı kilitleniyordu).
]

// When the model breaks the "English only" rule with another script (Cyrillic,
// CJK, Arabic, ...) the reply is withheld from the reader; measured per letter.
export function nonLatinLetterRatio(text: string): number {
  const letters: string[] = text.match(/\p{L}/gu) ?? []
  if (letters.length === 0) return 0
  const nonLatin = letters.filter(ch => !/\p{Script=Latin}/u.test(ch)).length
  return nonLatin / letters.length
}

const NON_LATIN_THRESHOLD = 0.3

// Latin-script terms that may legitimately appear in English food content and
// must never be treated as a foreign-language leak (brands, units, loanwords).
const ALLOWED_FOREIGN_WORDS = new Set([
  'whatsapp', 'web', 'www', 'sous', 'vide', 'al', 'dente', 'mise', 'en', 'place',
  'miso', 'ramen', 'pho', 'tapas', 'mezze', 'antipasti',
])

// Letters that exist in the Turkish alphabet but never in English (or in the
// French culinary loanwords English food writing borrows). Any word containing
// one of them is a Turkish leak. Turkish replies of 2-3 sentences virtually
// always contain at least one of these, which makes this the primary signal.
const TURKISH_ONLY_LETTERS = /[ğşıİĞŞ]/

// Common Turkish words that survive ASCII transliteration; English homographs
// ("de", "da", "ve" — the latter collides with the "I've" tokenisation) are
// deliberately NOT listed.
// 4.2: the list is FROZEN — new leak shapes are caught by the LLM judge in
// ChatService, do not extend it here (it is only a cheap pre-filter that saves
// a judge call).
const COMMON_TURKISH_WORDS = new Set([
  'merhaba', 'tesekkurler', 'tesekkur', 'lutfen', 'nedir', 'nasil', 'icin',
  'ile', 'veya', 'ama', 'daha', 'bilgi', 'fiyat', 'teklif', 'hizmet',
  'kurulum', 'gunes', 'elektrik', 'konut', 'aylik', 'fatura', 'musteri',
  'yardimci', 'olabilirim', 'istiyorum', 'uzgunum', 'evet', 'hayir', 'soru',
  'sorun', 'yanit', 'yemek', 'mutfak', 'bir', 'bu',
])

// The model can also glue a Turkish word onto an English one ("forkicin");
// words of 4+ letters are therefore matched as prefix/suffix too (3 letters and
// under only by exact match, to avoid false positives on English fragments).
const LONG_TURKISH_WORDS = [...COMMON_TURKISH_WORDS].filter(w => w.length >= 4)

// nonLatinLetterRatio catches other scripts but not Latin-script leaks
// ("aylik", "tentang", ...); this check closes that gap.
export function hasForeignWordLeak(text: string): boolean {
  // Explicit type required: match() ?? [] narrows to never[] under the ES2017 lib
  const words: string[] = text.toLowerCase().match(/[a-zçğıöşüâîû]+/g) ?? []
  return words.some(w => {
    if (ALLOWED_FOREIGN_WORDS.has(w)) return false
    if (TURKISH_ONLY_LETTERS.test(w) || COMMON_TURKISH_WORDS.has(w)) return true
    return LONG_TURKISH_WORDS.some(tw => w.startsWith(tw) || w.endsWith(tw))
  })
}

// Full contamination check for a chat reply: another script OR a Latin-script leak
export function isContaminated(text: string): boolean {
  return nonLatinLetterRatio(text) > NON_LATIN_THRESHOLD || hasForeignWordLeak(text)
}

// Summaries are checked for script only; they deliberately skip the foreign-word
// filter because the WhatsApp template carries brand terms.
export function hasNonLatinLeak(text: string): boolean {
  return nonLatinLetterRatio(text) > NON_LATIN_THRESHOLD
}

export function sanitizeContent(text: string): string {
  return text
    // null bytes and non-printable control chars (keep newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // strip Llama/ChatML special tokens that survive printable-char filter
    .replace(/<\|[^|>]{1,30}\|>/g, '')
    // strip markdown separators used to fake prompt boundaries (###, ----, ====)
    .replace(/#{3,}|-{4,}|={4,}/g, '')
    // collapse excessive whitespace/newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
