import { estimateCost, MODEL_PRICES, priceFor } from '../lib/cost'

describe('cost estimation', () => {
  it('prices gpt-5-nano from the recorded token counts', () => {
    // 100k in + 50k out => 100000/1e6*0.05 + 50000/1e6*0.40
    expect(estimateCost('gpt-5-nano', 100_000, 50_000)).toBeCloseTo(0.025, 6)
  })

  it('reuses the base price for a dated model snapshot', () => {
    expect(priceFor('gpt-5-nano-2026-01-15')).toEqual(MODEL_PRICES['gpt-5-nano'])
  })

  it('honours an explicit price override', () => {
    expect(estimateCost('some-future-model', 1_000_000, 1_000_000, { input: 1, output: 2 })).toBe(3)
  })

  it('falls back to the default price for an unknown model instead of throwing', () => {
    expect(estimateCost('mystery-model', 1_000_000, 0)).toBe(MODEL_PRICES['gpt-5-nano'].input)
  })

  it('is zero when nothing was consumed', () => {
    expect(estimateCost('gpt-5-nano', 0, 0)).toBe(0)
  })
})
