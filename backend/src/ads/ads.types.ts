// Ad placements the public site knows about. Adding one here is the only change
// needed on the backend; the admin form and the frontend renderer both read
// this list through the API response shape.
export const AD_PLACEMENTS = [
  'blogList',
  'blogArticleTop',
  'blogArticleBottom',
  'recipeDetail',
] as const

export type AdPlacement = (typeof AD_PLACEMENTS)[number]

export type AdSlots = Record<AdPlacement, string>

export interface AdsSettings {
  enabled: boolean
  clientId: string
  slots: AdSlots
}

export const EMPTY_SLOTS: AdSlots = {
  blogList: '',
  blogArticleTop: '',
  blogArticleBottom: '',
  recipeDetail: '',
}

export const DEFAULT_SETTINGS: AdsSettings = {
  enabled: false,
  clientId: '',
  slots: { ...EMPTY_SLOTS },
}
