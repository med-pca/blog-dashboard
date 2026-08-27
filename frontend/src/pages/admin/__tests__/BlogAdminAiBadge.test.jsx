import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../api/admin', () => ({
  fetchAllBlogPosts: vi.fn(),
  fetchAllProjects: vi.fn(),
  deleteBlogPost: vi.fn(),
  reorderBlogPosts: vi.fn(),
  fetchAllBlogComments: vi.fn(),
  moderateBlogComment: vi.fn(),
  deleteBlogComment: vi.fn(),
}))
vi.mock('../../../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

import { fetchAllBlogComments, fetchAllBlogPosts, fetchAllProjects } from '../../../api/admin'
import BlogAdmin from '../BlogAdmin'

// The admin list endpoint returns one page plus the filter-tab counts, so the
// tests hand back that envelope rather than a bare array.
function paged(posts, extra = {}) {
  const published = posts.filter((post) => post.published).length
  return {
    posts,
    page: 1,
    pageCount: 1,
    total: posts.length,
    offset: 0,
    filter: 'all',
    stats: {
      all: posts.length,
      published,
      draft: posts.length - published,
      duplicate: 0,
    },
    ...extra,
  }
}

const HAND_WRITTEN = {
  id: 'post-1',
  title: 'Our kitchen story',
  slug: 'our-kitchen-story',
  excerpt: 'Written by hand',
  coverImage: null,
  published: true,
  aiGenerated: false,
  createdAt: '2026-05-01T10:00:00.000Z',
  publishedAt: '2026-05-01T10:00:00.000Z',
}

const SMOOTHIES = { id: 'col-1', name: 'Smoothies', published: true }

const AI_DRAFT = {
  id: 'post-2',
  title: 'Sheet Pan Honey Garlic Chicken',
  slug: 'sheet-pan-honey-garlic-chicken',
  excerpt: 'Generated',
  coverImage: null,
  published: false,
  aiGenerated: true,
  createdAt: '2026-05-01T12:00:00.000Z',
  publishedAt: null,
}

function renderList() {
  return render(
    <MemoryRouter>
      <BlogAdmin />
    </MemoryRouter>,
  )
}

describe('BlogAdmin — AI Draft badge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(paged([HAND_WRITTEN, AI_DRAFT]))
    vi.mocked(fetchAllProjects).mockResolvedValue([SMOOTHIES])
    vi.mocked(fetchAllBlogComments).mockResolvedValue([])
  })

  it('lists generated drafts alongside hand-written posts', async () => {
    renderList()
    expect(await screen.findByText('Sheet Pan Honey Garlic Chicken')).toBeInTheDocument()
    expect(screen.getByText('Our kitchen story')).toBeInTheDocument()
  })

  it('marks an unpublished generated post as an AI Draft', async () => {
    renderList()
    expect(await screen.findByText('AI Draft')).toBeInTheDocument()
  })

  it('does not badge a hand-written post', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(paged([HAND_WRITTEN]))
    renderList()
    await screen.findByText('Our kitchen story')
    expect(screen.queryByText('AI Draft')).not.toBeInTheDocument()
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('keeps a short AI mark once the admin publishes the draft', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(paged([{ ...AI_DRAFT, published: true }]))
    renderList()
    expect(await screen.findByText('AI')).toBeInTheDocument()
    expect(screen.queryByText('AI Draft')).not.toBeInTheDocument()
  })

  it('shows the collection a post is linked to', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(paged([
      { ...HAND_WRITTEN, collectionId: 'col-1' },
    ]))
    renderList()
    expect(await screen.findByText('Smoothies')).toBeInTheDocument()
  })

  it('leaves the collection cell empty for an unassigned post', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(paged([HAND_WRITTEN]))
    renderList()
    await screen.findByText('Our kitchen story')
    expect(screen.queryByText('Smoothies')).not.toBeInTheDocument()
  })

  it('links a generated draft to the normal blog editor', async () => {
    renderList()
    await screen.findByText('Sheet Pan Honey Garlic Chicken')
    const links = screen.getAllByRole('link')
    expect(links.some((l) => l.getAttribute('href') === '/rnl-panel/blog/post-2/duzenle')).toBe(true)
  })
})
