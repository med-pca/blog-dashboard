import { hasForeignWordLeak, nonLatinLetterRatio } from '../chat-guards'

describe('nonLatinLetterRatio', () => {
  it('is low for English text', () => {
    expect(nonLatinLetterRatio('Roasted vegetables are quick, cheap and very forgiving.')).toBe(0)
  })

  it('is high for Cyrillic and CJK text', () => {
    expect(nonLatinLetterRatio('Солнечная энергия очень выгодна')).toBeGreaterThan(0.9)
    expect(nonLatinLetterRatio('太阳能非常有利')).toBeGreaterThan(0.9)
  })

  it('ignores digits and punctuation', () => {
    expect(nonLatinLetterRatio('4 servings: 250 g pasta!')).toBe(0)
    expect(nonLatinLetterRatio('123 !?')).toBe(0)
  })

  it('flags mixed text once non-Latin dominates', () => {
    expect(nonLatinLetterRatio('recipe цена стоимость сколько это будет')).toBeGreaterThan(0.3)
  })
})

describe('hasForeignWordLeak', () => {
  it('is false for clean English replies', () => {
    expect(hasForeignWordLeak('How many servings do you usually cook for?')).toBe(false)
    expect(hasForeignWordLeak('Thanks, I have everything I need for your weekly menu.')).toBe(false)
  })

  it('allows whitelisted brand and culinary terms', () => {
    expect(hasForeignWordLeak('Press the Continue on WhatsApp button below.')).toBe(false)
    expect(hasForeignWordLeak('Cook the pasta al dente, then finish it sous vide.')).toBe(false)
  })

  it('does not flag English contractions', () => {
    expect(hasForeignWordLeak("I've listed the pantry staples you'll need.")).toBe(false)
  })

  it('catches Turkish letters that do not exist in English', () => {
    expect(hasForeignWordLeak('Kaç kişilik yemek pişiriyorsunuz?')).toBe(true)
    expect(hasForeignWordLeak('How many servings do you need for kahvaltı?')).toBe(true)
  })

  it('catches common Turkish words written without special characters', () => {
    expect(hasForeignWordLeak('What is your aylik food budget?')).toBe(true)
    expect(hasForeignWordLeak('Merhaba, how many people do you cook for?')).toBe(true)
  })

  it('catches Turkish words glued to English words', () => {
    expect(hasForeignWordLeak('Tell me your budgetaylik and I will plan the week.')).toBe(true)
  })

  it('does not flag English words that merely contain a short listed token', () => {
    expect(hasForeignWordLeak('Bring the sauce to a simmer and stir in the butter.')).toBe(false)
  })
})
