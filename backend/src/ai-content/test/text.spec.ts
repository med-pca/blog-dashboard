import {
  countWords,
  DUPLICATE_SIMILARITY_THRESHOLD,
  findDuplicate,
  normalizeTopic,
  similarity,
  slugifyTopic,
  slugToWords,
} from '../lib/text'

describe('normalizeTopic', () => {
  it('lowercases, strips accents and punctuation, collapses spaces', () => {
    expect(normalizeTopic('  Crème Brûlée: the EASY way!  ')).toBe('creme brulee the easy way')
    expect(normalizeTopic('Köfte & Pilav (30 dk)')).toBe('kofte pilav 30 dk')
  })

  it('transliterates Turkish letters the plain NFD pass would drop', () => {
    expect(normalizeTopic('Şiş Kebabı')).toBe('sis kebabi')
    expect(normalizeTopic('İzmir Ğ')).toBe('izmir g')
  })
})

describe('slugifyTopic', () => {
  it('produces a slug the blog DTO accepts', () => {
    expect(slugifyTopic('Crème Brûlée: the EASY way!')).toBe('creme-brulee-the-easy-way')
    expect(slugifyTopic('Crème Brûlée: the EASY way!')).toMatch(/^[a-z0-9-]+$/)
  })

  it('never leaves a leading or trailing hyphen after truncation', () => {
    const slug = slugifyTopic('one two three four five six', 8)
    expect(slug).toBe('one-two')
  })

  it('reads a stored slug back as words', () => {
    expect(slugToWords('easy-weeknight-chicken-tacos')).toBe('easy weeknight chicken tacos')
  })
})

describe('similarity', () => {
  it('scores identical strings at 1 and unrelated ones near 0', () => {
    expect(similarity('chicken tacos', 'chicken tacos')).toBe(1)
    expect(similarity('chicken tacos', 'sourdough starter guide')).toBeLessThan(0.2)
  })

  it('catches reordered and lightly edited titles', () => {
    expect(similarity('easy weeknight chicken tacos', 'easy weeknight chicken tacos for two')).toBeGreaterThan(
      DUPLICATE_SIMILARITY_THRESHOLD,
    )
  })

  it('keeps genuinely different dishes below the threshold', () => {
    expect(similarity('creamy tomato pasta', 'creamy tomato soup')).toBeLessThan(DUPLICATE_SIMILARITY_THRESHOLD)
  })
})

describe('findDuplicate', () => {
  const taken = new Set([
    'easy weeknight chicken tacos',
    'sheet pan salmon with asparagus',
    'no knead sourdough bread',
  ])

  it('does not rely on exact equality alone', () => {
    const verdict = findDuplicate('Weeknight Chicken Tacos, Easy!', taken)
    expect(verdict.duplicate).toBe(true)
    expect(verdict.matched).toBe('easy weeknight chicken tacos')
  })

  it('lets a genuinely new subject through', () => {
    expect(findDuplicate('Slow Cooker Beef Chili for a Crowd', taken).duplicate).toBe(false)
  })

  it('treats an empty candidate as a duplicate rather than accepting it', () => {
    expect(findDuplicate('   ', taken).duplicate).toBe(true)
  })
})

describe('countWords', () => {
  it('counts the words in an HTML body, not the markup', () => {
    expect(countWords('<h2>Title</h2><p>one two three</p>')).toBe(4)
    expect(countWords('<p></p>')).toBe(0)
  })
})
