import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../api/admin', () => ({
  fetchChatRatings: vi.fn(),
  fetchChatLeads: vi.fn(),
  fetchChatFunnel: vi.fn(),
  deleteChatLead: vi.fn(),
  deleteChatRating: vi.fn(),
}))
vi.mock('../../../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

import { fetchChatFunnel, fetchChatLeads, fetchChatRatings } from '../../../api/admin'
import ChatDegerlendirme from '../ChatDegerlendirme'

const LEADS = {
  stats: { total: 3, active: 1, assisted: 2, contactRequested: 0 },
  leads: [
    {
      id: 'lead-1',
      sessionId: 's-1',
      conversation: [{ role: 'user', content: 'quick dinner?' }],
      messageCount: 3,
      status: 'assisted',
      rating: 4,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:05:00.000Z',
    },
    {
      id: 'lead-2',
      sessionId: 's-2',
      conversation: null,
      messageCount: 2,
      status: 'active',
      rating: null,
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:05:00.000Z',
    },
  ],
  page: 1,
  pageCount: 1,
}

const RATINGS = {
  stats: { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  ratings: [],
  page: 1,
  pageCount: 1,
}

const FUNNEL = { days: 30, opened: 40, messaged: 10, assisted: 6, rated: 3 }

describe('ChatDegerlendirme — chatbot outcomes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchChatLeads).mockResolvedValue(LEADS)
    vi.mocked(fetchChatRatings).mockResolvedValue(RATINGS)
    vi.mocked(fetchChatFunnel).mockResolvedValue(FUNNEL)
  })

  it('counts assisted conversations instead of a channel handoff', async () => {
    render(
      <MemoryRouter>
        <ChatDegerlendirme />
      </MemoryRouter>,
    )

    // the label appears twice: once on the stat card, once as the funnel step
    await waitFor(() => expect(screen.getAllByText('Assisted conversations')).toHaveLength(2))
    expect(screen.getByText('assisted by the chatbot')).toBeInTheDocument()
    expect(screen.getByText('no answer reached')).toBeInTheDocument()
    // both read the new `assisted` field: 6 in the funnel, 2 on the card
    expect(await screen.findByText('6')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
  })

  it('shows no WhatsApp terminology anywhere on the page', async () => {
    render(
      <MemoryRouter>
        <ChatDegerlendirme />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('assisted by the chatbot')).toBeInTheDocument())
    expect(document.body.textContent).not.toMatch(/whatsapp/i)
    expect(document.body.textContent).not.toMatch(/moved to/i)
  })
})
