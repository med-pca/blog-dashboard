import { AI_VENDOR_NAMES, AI_VENDORS, type AiVendorName } from './providers/registry'

// What the admin actually chose. Deliberately two scalar fields: "exactly one
// vendor is active" is then true by construction rather than by a rule someone
// has to remember to enforce.
export interface AiSettings {
  provider: AiVendorName
  // '' means "whatever the registry says is this vendor's default model", so a
  // vendor switch does not drag a stale model name along with it.
  model: string
}

export const DEFAULT_AI_SETTINGS: AiSettings = { provider: 'openai', model: '' }

// One row of the vendor picker. Carries no credential — only whether one is
// present, so the panel can grey out a vendor that cannot be reached.
export interface AiVendorView {
  name: AiVendorName
  label: string
  note: string
  defaultModel: string
  baseUrl: string | null
  strictJson: boolean
  keyConfigured: boolean
}

// The full admin payload: the stored choice, what it resolves to right now, and
// the catalogue to choose from.
export interface AiSettingsView extends AiSettings {
  // Differs from `provider` when the chosen vendor has no key and the router
  // fell back; null when the choice is being honoured as-is.
  fallbackReason: string | null
  effectiveProvider: AiVendorName
  effectiveModel: string
  vendors: AiVendorView[]
}

// The routing decision for a single call.
export interface ResolvedVendor {
  provider: AiVendorName
  model: string
  fallbackReason: string | null
}

export function vendorViews(hasKey: (name: AiVendorName) => boolean, defaultModel: (name: AiVendorName) => string): AiVendorView[] {
  return AI_VENDOR_NAMES.map(name => ({
    name,
    label: AI_VENDORS[name].label,
    note: AI_VENDORS[name].note,
    defaultModel: defaultModel(name),
    baseUrl: AI_VENDORS[name].baseUrl,
    strictJson: AI_VENDORS[name].jsonMode === 'schema',
    keyConfigured: hasKey(name),
  }))
}
