import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../api/blog.js', () => ({ fetchPosts: vi.fn() }))
vi.mock('../../components/SEO', () => ({ default: () => null }))
vi.mock('../../components/PageHeader', () => ({ default: ({ title }) => <div>{title}</div> }))
vi.mock('../../components/AdSenseBlock', () => ({ default: () => null }))

import { fetchPosts } from '../../api/blog.js'
import Blog from '../Blog'

function card(id) {
  return {
    id,
    title: `Recipe ${id}`,
    slug: `recipe-${id}`,
    excerpt: 'Tasty',
    coverImage: null,
    publishedAt: '2026-08-24T10:00:00.000Z',
    createdAt: '2026-08-24T10:00:00.000Z',
  }
}

function paged(posts, page, pageCount) {
  return { posts, page, pageCount, total: pageCount * 12 }
}

function renderBlog(entry = '/recipes') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/recipes" element={<Blog />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Blog pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    vi.mocked(fetchPosts).mockResolvedValue(paged([card('1')], 1, 3))
  })

  it('requests only the first page on a bare /recipes', async () => {
    renderBlog()
    await screen.findByText('Recipe 1')
    expect(fetchPosts).toHaveBeenCalledWith(1)
  })

  it('reads the page to load straight from ?page=', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(paged([card('9')], 3, 3))
    renderBlog('/recipes?page=3')
    await screen.findByText('Recipe 9')
    expect(fetchPosts).toHaveBeenCalledWith(3)
  })

  it('falls back to page 1 when ?page= is not a usable number', async () => {
    renderBlog('/recipes?page=abc')
    await screen.findByText('Recipe 1')
    expect(fetchPosts).toHaveBeenCalledWith(1)
  })

  it('renders each page as a crawlable link rather than a click handler', async () => {
    renderBlog()
    const two = await screen.findByRole('link', { name: 'Page 2' })
    expect(two).toHaveAttribute('href', '/recipes?page=2')
    // page 1 drops the query so the canonical list URL stays clean
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('href', '/recipes')
  })

  it('marks the current page for assistive tech', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(paged([card('9')], 2, 3))
    renderBlog('/recipes?page=2')
    await screen.findByText('Recipe 9')
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('hides the pager when everything fits on one page', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(paged([card('1')], 1, 1))
    renderBlog()
    await screen.findByText('Recipe 1')
    expect(screen.queryByRole('navigation', { name: 'Recipe pages' })).not.toBeInTheDocument()
  })

  it('offers a way back when a ?page= lands past the end', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(paged([], 99, 3))
    renderBlog('/recipes?page=99')
    expect(await screen.findByText('There are no recipes on this page.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the first page' })).toHaveAttribute(
      'href',
      '/recipes',
    )
  })

  it('still says the blog is empty on page 1 with no posts', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(paged([], 1, 1))
    renderBlog()
    expect(await screen.findByText('No recipes published yet.')).toBeInTheDocument()
  })

  it('fetches the next slice when the reader clicks through the pager', async () => {
    renderBlog()
    await screen.findByText('Recipe 1')

    vi.mocked(fetchPosts).mockResolvedValue(paged([card('20')], 2, 3))
    fireEvent.click(screen.getByRole('link', { name: 'Page 2' }))

    expect(await screen.findByText('Recipe 20')).toBeInTheDocument()
    await waitFor(() => expect(fetchPosts).toHaveBeenCalledWith(2))
  })
})
