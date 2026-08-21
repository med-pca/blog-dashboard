import { API } from './config'
import type { Faq } from '../types'

export async function fetchFaqs(): Promise<Faq[]> {
  const res = await fetch(`${API}/api/faq`)
  if (!res.ok) throw new Error('Could not load FAQs')
  return res.json()
}
