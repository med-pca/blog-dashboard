import { API } from './config'
import type { Project, ProjectMedia } from '../types'

export function mediaUrl(src: string | null | undefined): string {
  if (!src) return ''
  if (src.startsWith('https://') || src.startsWith('http://')) return src
  if (src.startsWith('/uploads/')) return `${API}${src}`
  return ''
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/api/projects`)
  if (!res.ok) throw new Error('Could not load collections')
  return res.json()
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  const res = await fetch(`${API}/api/projects/${encodeURIComponent(slug)}`)
  if (res.status === 404) {
    const err: Error & { status?: number } = new Error('Collection not found')
    err.status = 404
    throw err
  }
  if (!res.ok) throw new Error('Could not load the collection')
  return res.json()
}
