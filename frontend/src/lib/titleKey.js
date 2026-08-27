// Same normalization the API groups duplicates by: lowercase, then drop
// everything that is not a letter or digit, so "Miso Butter Carrots",
// "miso butter carrots!" and "  Miso   Butter Carrots " collapse to one key.
// Accents are kept on purpose (\p{L} matches them): "Crème" and "Creme" stay
// distinct rather than being merged on a guess.
export function titleKey(title) {
  return (title || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}
