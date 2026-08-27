import { API } from './config'
import type { BlogComment, BlogPost, PagedPosts } from '../types'

// One page of published posts (12 per page) rather than the whole blog.
// The returned pageCount is always the real one, so a ?page= beyond the end
// renders an empty grid the pager can still navigate out of.
export async function fetchPosts(page = 1): Promise<PagedPosts> {
  const res = await fetch(`${API}/api/blog?page=${page}`)
  if (!res.ok) throw new Error('Could not load blog posts')
  return res.json()
}

export async function fetchApprovedComments(slug: string): Promise<BlogComment[]> {
  const res = await fetch(`${API}/api/blog/${encodeURIComponent(slug)}/comments`)
  if (!res.ok) throw new Error('Could not load comments')
  return res.json()
}

export async function submitBlogComment(
  slug: string,
  data: Pick<BlogComment, 'authorName' | 'content'> & { authorEmail: string },
): Promise<{ id: string; status: 'pending'; message: string }> {
  const res = await fetch(`${API}/api/blog/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message.join(' · ') : json.message || 'Could not submit comment')
  return json
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
