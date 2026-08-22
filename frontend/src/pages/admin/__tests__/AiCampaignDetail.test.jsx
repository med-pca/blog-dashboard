import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../../api/aiContent', () => ({
  fetchAiCampaign: vi.fn(),
  fetchAiCampaignStats: vi.fn(),
  fetchAiCampaignDrafts: vi.fn(),
  generateAiTestDraft: vi.fn(),
  generateAiNext: vi.fn(),
  setAiCampaignState: vi.fn(),
}))
vi.mock('../../../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

import {
  fetchAiCampaign,
  fetchAiCampaignDrafts,
  fetchAiCampaignStats,
  generateAiNext,
  generateAiTestDraft,
  setAiCampaignState,
} from '../../../api/aiContent'
import AiCampaignDetail from '../AiCampaignDetail'

const CAMPAIGN = {
  id: 'camp-1',
  name: 'Weeknight dinners',
  dailyTarget: 40,
  intervalMinutes: 20,
  generationStartHour: 8,
  generationEndHour: 22,
  timezone: 'America/New_York',
  enabled: true,
  status: 'active',
}

const STATS = {
  campaignId: 'camp-1',
  status: 'active',
  enabled: true,
  dailyTarget: 40,
  generatedToday: 12,
  remainingToday: 28,
  queued: 1,
  running: 0,
  failed24h: 2,
  succeeded24h: 12,
  totalDrafts: 57,
  nextGenerationAt: '2026-05-01T18:20:00.000Z',
  lastGenerationAt: '2026-05-01T18:00:00.000Z',
  lastRunAt: '2026-05-01T18:00:00.000Z',
  inputTokens: 120_000,
  outputTokens: 340_000,
  estimatedCost: 0.1420,
  schedule: {
    requiredMinutes: 780,
    availableMinutes: 840,
    fits: true,
    lastStartLabel: '21:00',
    maxArticlesInWindow: 43,
    suggestedIntervalMinutes: 21,
  },
  unavailableReason: null,
}

const DRAFTS = [
  { id: 'post-1', title: 'Sheet Pan Honey Garlic Chicken', slug: 'sheet-pan-honey-garlic-chicken', published: false },
  { id: 'post-2', title: 'Slow Cooker Beef Chili', slug: 'slow-cooker-beef-chili', published: true },
]

// The stat card renders its label and its value in sibling blocks.
function statCard(label) {
  return screen.getByText(label).closest('div.bg-white')
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/rnl-panel/ai-kampanyalar/camp-1']}>
      <Routes>
        <Route path="/rnl-panel/ai-kampanyalar/:id" element={<AiCampaignDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AiCampaignDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiCampaign).mockResolvedValue(CAMPAIGN)
    vi.mocked(fetchAiCampaignStats).mockResolvedValue(STATS)
    vi.mocked(fetchAiCampaignDrafts).mockResolvedValue(DRAFTS)
    vi.mocked(generateAiTestDraft).mockResolvedValue({ job: { id: 'job-1' } })
    vi.mocked(generateAiNext).mockResolvedValue({ job: { id: 'job-2' } })
    vi.mocked(setAiCampaignState).mockResolvedValue({ ...CAMPAIGN, enabled: false, status: 'paused' })
  })

  it('shows a loading state first', () => {
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('summarises today, the queue and the consumption', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Weeknight dinners' })).toBeInTheDocument()
    expect(statCard('Target today')).toHaveTextContent('40')
    expect(statCard('Done today')).toHaveTextContent('12')
    expect(statCard('Remaining today')).toHaveTextContent('28')
    expect(statCard('Failed (24h)')).toHaveTextContent('2')
    expect(screen.getByText('120,000')).toBeInTheDocument()
    expect(screen.getByText('340,000')).toBeInTheDocument()
    expect(screen.getByText('$0.1420')).toBeInTheDocument()
    expect(screen.getByText('13 h')).toBeInTheDocument()
  })

  it('lists the generated drafts with an AI Draft badge until they are published', async () => {
    renderPage()
    expect(await screen.findByText('Sheet Pan Honey Garlic Chicken')).toBeInTheDocument()
    expect(screen.getByText('AI Draft')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('links a draft to its editor page', async () => {
    renderPage()
    const link = await screen.findByRole('link', { name: 'Sheet Pan Honey Garlic Chicken' })
    expect(link).toHaveAttribute('href', '/rnl-panel/blog/post-1/duzenle')
  })

  it('queues a test draft and says it is outside the daily count', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Generate one test draft/ }))
    await waitFor(() => expect(generateAiTestDraft).toHaveBeenCalledWith('camp-1'))
    expect(await screen.findByText(/does not count against/)).toBeInTheDocument()
  })

  it('asks for confirmation before pulling the next article forward', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Generate next article now/ }))
    await waitFor(() => expect(generateAiNext).toHaveBeenCalledWith('camp-1'))
  })

  it('does nothing when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Generate next article now/ }))
    expect(generateAiNext).not.toHaveBeenCalled()
  })

  it('pauses the campaign and then offers to resume it', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Pause' }))
    await waitFor(() => expect(setAiCampaignState).toHaveBeenCalledWith('camp-1', 'pause'))
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('resumes a paused campaign', async () => {
    vi.mocked(fetchAiCampaign).mockResolvedValue({ ...CAMPAIGN, enabled: false, status: 'paused' })
    vi.mocked(setAiCampaignState).mockResolvedValue({ ...CAMPAIGN, enabled: true, status: 'active' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Resume' }))
    await waitFor(() => expect(setAiCampaignState).toHaveBeenCalledWith('camp-1', 'resume'))
  })

  it('warns when the window cannot hold the plan', async () => {
    vi.mocked(fetchAiCampaignStats).mockResolvedValue({
      ...STATS,
      schedule: { ...STATS.schedule, fits: false, availableMinutes: 480 },
    })
    renderPage()
    expect(await screen.findByText(/needs 13 h but\s+offers 8 h/)).toBeInTheDocument()
  })

  it('explains a disabled feature flag', async () => {
    vi.mocked(fetchAiCampaignStats).mockResolvedValue({
      ...STATS,
      unavailableReason: 'AI content generation is disabled (AI_CONTENT_ENABLED is not "true")',
    })
    renderPage()
    expect(await screen.findByText(/Generation is not running/)).toBeInTheDocument()
  })

  it('surfaces a failed on-demand run', async () => {
    vi.mocked(generateAiTestDraft).mockRejectedValue(
      new Error('A generation is already in flight for this campaign'),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Generate one test draft/ }))
    expect(await screen.findByText(/already in flight/)).toBeInTheDocument()
  })

  it('reports a load failure instead of rendering an empty page', async () => {
    vi.mocked(fetchAiCampaign).mockRejectedValue(new Error('Campaign not found'))
    renderPage()
    expect(await screen.findByText('Campaign not found')).toBeInTheDocument()
  })
})
