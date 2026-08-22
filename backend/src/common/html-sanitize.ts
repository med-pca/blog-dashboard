import sanitizeHtml from 'sanitize-html'

// Blog içeriği için allowlist — frontend'deki tiptap editörünün (RichTextEditor.jsx)
// üretebildiği çıktıyla birebir: StarterKit (h1-h3), Underline, TextStyle+Color,
// FontFamily, TextAlign, Link. Editöre yeni extension eklenirse burası da güncellenmeli,
// yoksa meşru içerik yazma anında budanır. Render tarafındaki DOMPurify (BlogDetay.jsx)
// ikinci savunma katmanı olarak kalır.
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'a', 'span',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    span: ['style'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
      'font-family': [/^[\w\s,'"-]+$/],
      'text-align': [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
}

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, RICH_TEXT_OPTIONS)
}

// Generated articles get a narrower allowlist than the editor's: no headings
// above h2 (the page renders the title as h1), no inline styles, no code
// blocks. The result still passes through sanitizeRichHtml on write, so this
// pass only narrows — it can never widen what reaches the database.
const AI_ARTICLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'blockquote', 'a'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    // The model is told to start at h2; a stray h1 is demoted rather than dropped.
    h1: 'h2',
    h4: 'h3',
    h5: 'h3',
    h6: 'h3',
  },
}

export function sanitizeAiHtml(html: string): string {
  return sanitizeHtml(html, AI_ARTICLE_OPTIONS)
}

// Düz metin alanları (örn. excerpt) için: tüm tag'leri söker
export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim()
}
