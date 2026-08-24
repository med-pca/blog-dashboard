import { API } from './config'

// Backend retry'ları dahil en kötü durumu karşılayacak kadar uzun
const TIMEOUT_MS = 60000

// Konuşma geçmişi sunucuda (sessionId anahtarıyla) tutulur; istemci yalnızca
// yeni kullanıcı mesajını gönderir. messages state'i sadece görüntü içindir.
async function post(path: string, body: object): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function sendChatMessage(message: string, sessionId: string): Promise<{ reply: string }> {
  const res = await post('/api/chat', { message, sessionId })
  if (!res.ok) throw new Error('Could not get a reply')
  return res.json()
}

// Huni sayacı; hata sessizce yutulur, istatistik kaybı akışı etkilememeli
export function trackChatOpen(): void {
  fetch(`${API}/api/chat/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'open' }),
  }).catch(() => {})
}

export async function submitChatRating(rating: number, sessionId: string): Promise<void> {
  const res = await post('/api/chat/rating', { rating, sessionId })
  if (!res.ok) throw new Error('Could not submit the rating')
}
