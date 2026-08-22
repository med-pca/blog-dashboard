import { API } from "../api/config.js";

// Bundled artwork used when a post has no cover of its own.
export const FOOD_FALLBACKS = [
  "/food/illustration-1.svg",
  "/food/illustration-2.svg",
  "/food/illustration-3.svg",
  "/food/illustration-4.svg",
];

// A list index picks round-robin; a slug picks deterministically, so the same
// post keeps the same illustration on every page that renders it.
export function fallbackCover(seed = 0) {
  if (typeof seed === "number") return FOOD_FALLBACKS[seed % FOOD_FALLBACKS.length];
  const sum = Array.from(String(seed)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FOOD_FALLBACKS[sum % FOOD_FALLBACKS.length];
}

// Bundled artwork under /food/ is served by the frontend; uploads live on the
// API host and need the API origin prefixed.
export function resolveCoverSrc(coverImage, seed = 0) {
  if (!coverImage) return fallbackCover(seed);
  if (/^https?:\/\//i.test(coverImage)) return coverImage;
  if (coverImage.startsWith("/food/")) return coverImage;
  return `${API}${coverImage}`;
}
