// Ready-to-publish social copy for one article, produced alongside it by the AI
// pipeline and served by GET /api/blog/:slug/post.
//
// Stored as a single jsonb column rather than separate columns: the caption list
// is variable-length, no field is ever filtered or sorted on, and the whole
// thing is written and read as one unit.

export interface SocialCaption {
  // What this variant leads with ("problem", "curiosity", "seasonal"…), so a
  // human picking one can see at a glance how they differ.
  angle: string
  // The caption itself. Plain text, no HTML — Facebook renders none.
  text: string
}

export interface SocialPost {
  captions: SocialCaption[]
  // Stored WITHOUT the leading '#', so a caller can format them as it likes.
  hashtags: string[]
  // Brief for the accompanying social image. Deliberately distinct from
  // aiImagePrompt: the cover image illustrates the article, this one has to stop
  // a thumb scrolling past it.
  imagePrompt: string
}

export const EMPTY_SOCIAL_POST: SocialPost = { captions: [], hashtags: [], imagePrompt: '' }
