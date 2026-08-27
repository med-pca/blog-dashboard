import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../api/blog.js', () => ({
  fetchPostBySlug: vi.fn(),
  fetchApprovedComments: vi.fn(() => Promise.resolve([])),
  submitBlogComment: vi.fn(),
}))
vi.mock('../../components/SEO', () => ({ default: () => null }))
vi.mock('../../components/PageHeader', () => ({ default: ({ title }) => <div>{title}</div> }))
vi.mock('../../components/AdSenseBlock', () => ({ default: () => null }))

import { fetchPostBySlug } from '../../api/blog.js'
import BlogDetay from '../BlogDetay'

const POST = {
  id: 'post-1',
  title: 'Reviewed recipe',
  slug: 'reviewed-recipe',
  excerpt: 'A carefully reviewed recipe.',
  metaDescription: 'A carefully reviewed recipe.',
  content: '<h2>Method</h2><p>Cook carefully.</p>',
  coverImage: null,
  published: true,
  publishedAt: '2026-08-24T10:00:00.000Z',
  createdAt: '2026-08-24T10:00:00.000Z',
  updatedAt: '2026-08-24T10:00:00.000Z',
}

function renderPost() {
  return render(
    <MemoryRouter initialEntries={['/recipes/reviewed-recipe']}>
      <Routes>
        <Route path="/recipes/:slug" element={<BlogDetay />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BlogDetay editorial rating', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a manually assigned score', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue({ ...POST, editorialRating: 9.2 })
    renderPost()

    expect(await screen.findByLabelText('Editorial rating: 9.2 out of 10')).toBeInTheDocument()
    expect(screen.getByText('9.2/10')).toBeInTheDocument()
  })

  it('hides the badge when the article has not been scored', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue({ ...POST, editorialRating: null })
    renderPost()

    await screen.findByText('A carefully reviewed recipe.')
    expect(screen.queryByText('Editorial Rating')).not.toBeInTheDocument()
  })
})
