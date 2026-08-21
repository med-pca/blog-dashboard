import { API } from './config'

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

const ADS_OFF: AdsSettings = { enabled: false, clientId: '', slots: { ...EMPTY_SLOTS } }

// The public config is the same for every visitor, so it is fetched once per
// page load and shared by every ad slot on the page.
let configPromise: Promise<AdsSettings> | null = null

export function getAdsConfig(): Promise<AdsSettings> {
  if (!configPromise) {
    configPromise = fetch(`${API}/api/ads/config`)
      .then((res) => (res.ok ? res.json() : ADS_OFF))
      // Ads must never break the page: any failure simply means "no ads".
      .catch(() => ADS_OFF)
  }
  return configPromise
}

// Lets the admin preview a save without a full reload.
export function resetAdsConfigCache(): void {
  configPromise = null
}

function authOptions(extra: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...extra,
  }
}

function apiError(res: Response, message: string): Error {
  return Object.assign(new Error(message), { status: res.status })
}

export async function fetchAdsSettings(): Promise<AdsSettings> {
  const res = await fetch(`${API}/api/ads/admin`, authOptions())
  if (!res.ok) throw apiError(res, 'Could not load the ad settings')
  return res.json()
}

export async function saveAdsSettings(settings: AdsSettings): Promise<AdsSettings> {
  const res = await fetch(`${API}/api/ads/admin`, authOptions({
    method: 'PUT',
    body: JSON.stringify(settings),
  }))
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = Array.isArray(json.message) ? json.message.join(' · ') : json.message
    throw apiError(res, message || 'Could not save the ad settings')
  }
  resetAdsConfigCache()
  return json
}
