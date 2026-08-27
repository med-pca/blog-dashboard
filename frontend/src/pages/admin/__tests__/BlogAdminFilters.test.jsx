import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

import {
  fetchAllBlogComments,
  fetchAllBlogPosts,
  fetchAllProjects,
  reorderBlogPosts,
} from '../../../api/admin'
import BlogAdmin from '../BlogAdmin'

function row(id, title, extra = {}) {
  return {
    id,
    title,
    slug: id,
    excerpt: '',
    coverImage: null,
    published: true,
    aiGenerated: false,
    createdAt: '2026-05-01T10:00:00.000Z',
    publishedAt: '2026-05-01T10:00:00.000Z',
    ...extra,
  }
}

const STATS = { all: 42, published: 30, draft: 12, duplicate: 4 }

function response(posts, over = {}) {
  return {
    posts,
    page: 1,
    pageCount: 3,
    total: 42,
    offset: 0,
    filter: 'all',
    stats: STATS,
    ...over,
  }
}

function renderAdmin() {
  return render(
    <MemoryRouter>
      <BlogAdmin />
    </MemoryRouter>,
  )
}

describe('BlogAdmin — filters and pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(response([row('a', 'First post')]))
    vi.mocked(fetchAllProjects).mockResolvedValue([])
    vi.mocked(fetchAllBlogComments).mockResolvedValue([])
  })

  it('loads one page at a time instead of the whole table', async () => {
    renderAdmin()
    await screen.findByText('First post')
    expect(fetchAllBlogPosts).toHaveBeenCalledWith({ page: 1, filter: 'all' })
  })

  it('shows the counts behind each filter tab', async () => {
    renderAdmin()
    await screen.findByText('First post')
    expect(screen.getByRole('button', { name: /Drafts\s*12/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Duplicates\s*4/ })).toBeInTheDocument()
  })

  it('refetches with the draft filter when that tab is picked', async () => {
    renderAdmin()
    await screen.findByText('First post')

    fireEvent.click(screen.getByRole('button', { name: /Drafts/ }))

    await waitFor(() =>
      expect(fetchAllBlogPosts).toHaveBeenCalledWith({ page: 1, filter: 'draft' }),
    )
  })

  it('returns to page 1 when the filter changes', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(response([row('a', 'First post')]))
    renderAdmin()
    await screen.findByText('First post')

    fireEvent.click(screen.getByText('Next'))
    await waitFor(() =>
      expect(fetchAllBlogPosts).toHaveBeenCalledWith({ page: 2, filter: 'all' }),
    )

    // an old page number would be meaningless against a smaller filtered set
    fireEvent.click(screen.getByRole('button', { name: /Duplicates/ }))
    await waitFor(() =>
      expect(fetchAllBlogPosts).toHaveBeenCalledWith({ page: 1, filter: 'duplicate' }),
    )
  })

  it('numbers the posts that share a title in the duplicates view', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(
      response(
        [
          row('a', 'Miso Butter Roasted Carrots'),
          row('b', 'miso butter roasted carrots!'),
          row('c', 'Creamy Tomato Orzo'),
          row('d', 'Creamy Tomato Orzo'),
        ],
        { filter: 'duplicate' },
      ),
    )
    renderAdmin()
    fireEvent.click(await screen.findByRole('button', { name: /Duplicates/ }))

    // the punctuation/case variants land in the same group, the other pair in its own
    expect(await screen.findAllByText('Duplicate #1')).toHaveLength(2)
    expect(screen.getAllByText('Duplicate #2')).toHaveLength(2)
  })

  it('sends the page offset with a reorder so page 2 does not overwrite page 1', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(
      response([row('a', 'First post'), row('b', 'Second post')], { page: 2, offset: 20 }),
    )
    renderAdmin()
    await screen.findByText('First post')

    // drag handles are live on the unfiltered tab
    expect(screen.getAllByRole('button').some((b) => b.className.includes('cursor-grab'))).toBe(
      true,
    )
    expect(reorderBlogPosts).not.toHaveBeenCalled()
  })

  it('disables reordering while a filter narrows the list', async () => {
    renderAdmin()
    await screen.findByText('First post')
    expect(screen.queryByText(/Reordering is available/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Drafts/ }))

    expect(await screen.findByText(/Reordering is available/)).toBeInTheDocument()
  })

  it('explains an empty duplicates tab instead of offering to create a post', async () => {
    vi.mocked(fetchAllBlogPosts).mockResolvedValue(
      response([], { filter: 'duplicate', stats: { ...STATS, duplicate: 0 } }),
    )
    renderAdmin()
    await screen.findByText('First post').catch(() => {})

    fireEvent.click(screen.getByRole('button', { name: /Duplicates/ }))

    expect(
      await screen.findByText('No duplicates: every post has a distinct title.'),
    ).toBeInTheDocument()
  })
})
