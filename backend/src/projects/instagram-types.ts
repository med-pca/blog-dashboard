// Instagram Graph API medya alanları — INSTAGRAM_MEDIA_FIELDS sorgusuyla birebir.
// media_type pratikte IMAGE | VIDEO | CAROUSEL_ALBUM; Graph API yeni tip
// ekleyebildiği için string'e açık bırakılır.
export interface InstagramChild {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string | null
}

export interface InstagramPost extends InstagramChild {
  caption?: string
  timestamp?: string
  children?: { data: InstagramChild[] }
}

export interface InstagramMediaListResponse {
  data?: InstagramPost[]
}

// Auto-fill çıktısı (project-autofill.schema.ts Structured Outputs şeması).
// Model alan atlayabildiği için hepsi opsiyonel; tüketen taraf default'lar.
// Bu yalnızca tip sözleşmesi — ÇALIŞMA ZAMANI doğrulaması dto/parsed-project.dto.ts
// içindeki ParsedProjectDto'da; ikisi birlikte güncellenmeli.
export interface ParsedProject {
  name?: string
  location?: string
  kw?: number
  date?: string
  description?: string
  about?: string
  specs?: string[]
  highlights?: string[]
  statBoxes?: { value: string; label: string }[]
  category?: string | null
}

// Meta webhook gövdesi — yalnızca kullanılan alanlar
export interface InstagramWebhookBody {
  object?: string
  entry?: {
    changes?: {
      field?: string
      value?: { verb?: string; media?: { id?: string } }
    }[]
  }[]
}
