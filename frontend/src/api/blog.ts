import { API } from './config'
import type { BlogPost } from '../types'

export async function fetchPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API}/api/blog`)
  if (!res.ok) throw new Error('Could not load blog posts')
  return res.json()
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost> {
  const res = await fetch(`${API}/api/blog/${encodeURIComponent(slug)}`)
  if (res.status === 404) {
    const err: Error & { status?: number } = new Error('Blog post not found')
    err.status = 404
    throw err
  }
  if (!res.ok) throw new Error('Could not load the blog post')
  return res.json()
}
