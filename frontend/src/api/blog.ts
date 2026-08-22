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

// Posts linked to one collection (Project). Used by the collection detail page.
export async function fetchPostsByCollection(collectionId: string): Promise<BlogPost[]> {
  const res = await fetch(`${API}/api/blog/collection/${encodeURIComponent(collectionId)}`)
  if (!res.ok) throw new Error('Could not load the recipes in this collection')
  return res.json()
}

// { collectionId: publishedPostCount } — one call for the whole collections grid.
export async function fetchCollectionPostCounts(): Promise<Record<string, number>> {
  const res = await fetch(`${API}/api/blog/collection-counts`)
  if (!res.ok) throw new Error('Could not load collection recipe counts')
  return res.json()
}
