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

const BASE = {
  id: 'post-1',
  title: 'Cheesy Chicken Crescent Bake',
  slug: 'cheesy-chicken-crescent-bake',
  excerpt: 'An easy family dinner.',
  content: '<p>The story behind the bake.</p>',
  ingredients: '<ul><li>300g chicken</li><li>1 crescent roll tube</li></ul>',
  method: '<ol><li>Heat the oven.</li><li>Bake for 30 minutes.</li></ol>',
  coverImage: null,
  published: true,
  publishedAt: '2026-08-24T10:00:00.000Z',
  createdAt: '2026-08-24T10:00:00.000Z',
  updatedAt: '2026-08-24T10:00:00.000Z',
}

function renderPost(post) {
  vi.mocked(fetchPostBySlug).mockResolvedValue(post)
  return render(
    <MemoryRouter initialEntries={['/recipes/cheesy-chicken-crescent-bake']}>
      <Routes>
        <Route path="/recipes/:slug" element={<BlogDetay />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BlogDetay — recipe card', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders no card at all when none of the fields are filled', async () => {
    renderPost(BASE)
    await screen.findByText('Ingredients')
    expect(screen.queryByLabelText('Recipe details')).not.toBeInTheDocument()
    expect(screen.queryByText('Prep time')).not.toBeInTheDocument()
  })

  it('lists only the fields that were filled in', async () => {
    renderPost({ ...BASE, prepMinutes: 10, servings: '8 crescents' })
    expect(await screen.findByText('Prep time')).toBeInTheDocument()
    expect(screen.getByText('8 crescents')).toBeInTheDocument()
    // never filled, so it stays out of the card rather than showing blank
    expect(screen.queryByText('Cuisine')).not.toBeInTheDocument()
    expect(screen.queryByText('Calories')).not.toBeInTheDocument()
  })

  it('adds prep and cook into a total when no total was given', async () => {
    renderPost({ ...BASE, prepMinutes: 10, cookMinutes: 30 })
    expect(await screen.findByText('Total time')).toBeInTheDocument()
    expect(screen.getByText('40 min')).toBeInTheDocument()
  })

  it('lets an explicit total win, for recipes that rest or marinate', async () => {
    renderPost({ ...BASE, prepMinutes: 10, cookMinutes: 30, totalMinutes: 130 })
    expect(await screen.findByText('2 hr 10 min')).toBeInTheDocument()
    expect(screen.queryByText('40 min')).not.toBeInTheDocument()
  })

  it('writes hours out once a time passes an hour', async () => {
    renderPost({ ...BASE, cookMinutes: 60 })
    // cook time and the derived total both read "1 hr" here
    expect(await screen.findAllByText('1 hr')).toHaveLength(2)
  })

  it('shows a zero prep time rather than treating it as missing', async () => {
    renderPost({ ...BASE, prepMinutes: 0, cookMinutes: 20 })
    expect(await screen.findByText('Prep time')).toBeInTheDocument()
    expect(screen.getByText('0 min')).toBeInTheDocument()
  })

  it('labels calories with their unit', async () => {
    renderPost({ ...BASE, calories: 430 })
    expect(await screen.findByText('430 kcal')).toBeInTheDocument()
  })
})

describe('BlogDetay — recipe layout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no longer renders the "In this recipe" table of contents', async () => {
    renderPost(BASE)
    await screen.findByText('Ingredients')
    expect(screen.queryByText('In this recipe')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).not.toBeInTheDocument()
  })

  it('orders the page story → recipe card → ingredients → method', async () => {
    const { container } = renderPost({ ...BASE, servings: '8 crescents' })
    await screen.findByText('Ingredients')

    const order = [...container.querySelectorAll('#recipe-card, #recipe-ingredients, #recipe-method')]
    expect(order.map((el) => el.id)).toEqual([
      'recipe-card',
      'recipe-ingredients',
      'recipe-method',
    ])
  })

  it('keeps the author card, moved to the end of the article', async () => {
    renderPost({ ...BASE, authorName: 'Pulse Recipe Editorial Team' })
    expect(await screen.findByText('About the author')).toBeInTheDocument()
  })
})
