// USD per million tokens. Used only to turn the token counts we actually
// recorded into an estimate for the admin panel — never to cap spending.
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
}

const FALLBACK_PRICE = MODEL_PRICES['gpt-5-nano']

export function priceFor(model: string, override?: { input: number; output: number } | null) {
  if (override) return override
  // Dated snapshots ("gpt-5-nano-2026-01-01") share the base model's price.
  const exact = MODEL_PRICES[model]
  if (exact) return exact
  const base = Object.keys(MODEL_PRICES).find(key => model.startsWith(key))
  return base ? MODEL_PRICES[base] : FALLBACK_PRICE
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  override?: { input: number; output: number } | null,
): number {
  const price = priceFor(model, override)
  const usd = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output
  return Math.round(usd * 1e6) / 1e6
}
