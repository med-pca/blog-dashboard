import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../api/aiContent', () => ({
  fetchAiJobs: vi.fn(),
  fetchAiCampaigns: vi.fn(),
  retryAiJob: vi.fn(),
}))
vi.mock('../../../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

import { fetchAiCampaigns, fetchAiJobs, retryAiJob } from '../../../api/aiContent'
import AiLoglar from '../AiLoglar'

const SUCCEEDED = {
  id: 'job-1',
  campaignId: 'camp-1',
  campaign: { id: 'camp-1', name: 'Weeknight dinners' },
  queueJobId: 'sch:camp-1:1',
  plannedFor: '2026-05-01T18:00:00.000Z',
  topic: 'Sheet Pan Honey Garlic Chicken',
  status: 'succeeded',
  triggerType: 'scheduled',
  attempt: 1,
  maxAttempts: 3,
  blogPostId: 'post-1',
  model: 'gpt-5-nano',
  inputTokens: 1000,
  outputTokens: 2160,
  estimatedCost: 0.000914,
  errorCode: null,
  errorMessage: null,
  startedAt: '2026-05-01T18:00:05.000Z',
  completedAt: '2026-05-01T18:00:47.000Z',
  createdAt: '2026-05-01T18:00:00.000Z',
}

const FAILED = {
  ...SUCCEEDED,
  id: 'job-2',
  topic: 'Slow Cooker Beef Chili',
  status: 'failed',
  triggerType: 'manual',
  attempt: 3,
  blogPostId: null,
  errorCode: 'RATE_LIMITED',
  errorMessage: 'Rate limit reached for gpt-5-nano',
  completedAt: '2026-05-01T18:01:00.000Z',
}

function renderPage(entry = '/rnl-panel/ai-loglar') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AiLoglar />
    </MemoryRouter>,
  )
}

function jobsPage(jobs, extra = {}) {
  return { jobs, page: 1, pageCount: 1, total: jobs.length, ...extra }
}

describe('AiLoglar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiJobs).mockResolvedValue(jobsPage([SUCCEEDED, FAILED]))
    vi.mocked(fetchAiCampaigns).mockResolvedValue([{ id: 'camp-1', name: 'Weeknight dinners' }])
    vi.mocked(retryAiJob).mockResolvedValue({ id: 'job-3' })
  })

  it('shows a loading state before the first page arrives', () => {
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders every column the log page promises', async () => {
    renderPage()
    expect(await screen.findByText('Sheet Pan Honey Garlic Chicken')).toBeInTheDocument()
    expect(screen.getAllByText(/Weeknight dinners · scheduled · attempt 1\/3 · gpt-5-nano/)).toHaveLength(1)
    expect(screen.getByText('succeeded')).toBeInTheDocument()
    expect(screen.getByText('Duration: 42s')).toBeInTheDocument()
    expect(screen.getAllByText('Tokens: 1000 in / 2160 out')).toHaveLength(2)
    expect(screen.getAllByText('Cost: $0.0009')).toHaveLength(2)
  })

  it('shows the sanitised error on a failed run', async () => {
    renderPage()
    expect(await screen.findByText(/Rate limit reached for gpt-5-nano/)).toBeInTheDocument()
    expect(screen.getByText('[RATE_LIMITED]')).toBeInTheDocument()
  })

  it('links a successful run to the draft it created', async () => {
    renderPage()
    const link = await screen.findByTitle('Open the generated draft')
    expect(link).toHaveAttribute('href', '/rnl-panel/blog/post-1/duzenle')
  })

  it('offers Retry only where a rerun is allowed', async () => {
    renderPage()
    await screen.findByText('Sheet Pan Honey Garlic Chicken')
    expect(screen.getAllByTitle('Retry this generation')).toHaveLength(1)
  })

  it('retries a failed run and reloads the list', async () => {
    renderPage()
    await userEvent.click(await screen.findByLabelText('Retry job job-2'))
    await waitFor(() => expect(retryAiJob).toHaveBeenCalledWith('job-2'))
    await waitFor(() => expect(fetchAiJobs).toHaveBeenCalledTimes(2))
  })

  it('filters by status and resets to the first page', async () => {
    renderPage()
    await screen.findByText('Sheet Pan Honey Garlic Chicken')
    await userEvent.click(screen.getByRole('button', { name: 'Failed' }))
    await waitFor(() =>
      expect(fetchAiJobs).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed', page: 1 })),
    )
  })

  it('filters by trigger type', async () => {
    renderPage()
    await screen.findByText('Sheet Pan Honey Garlic Chicken')
    await userEvent.click(screen.getByRole('button', { name: 'Manual' }))
    await waitFor(() =>
      expect(fetchAiJobs).toHaveBeenLastCalledWith(expect.objectContaining({ triggerType: 'manual' })),
    )
  })

  it('filters by campaign', async () => {
    renderPage()
    await screen.findByText('Sheet Pan Honey Garlic Chicken')
    await userEvent.selectOptions(await screen.findByLabelText('Campaign filter'), 'camp-1')
    await waitFor(() =>
      expect(fetchAiJobs).toHaveBeenLastCalledWith(expect.objectContaining({ campaignId: 'camp-1' })),
    )
  })

  it('starts pre-filtered when arriving from a campaign', async () => {
    renderPage('/rnl-panel/ai-loglar?campaignId=camp-1')
    await waitFor(() =>
      expect(fetchAiJobs).toHaveBeenCalledWith(expect.objectContaining({ campaignId: 'camp-1' })),
    )
  })

  it('says so when nothing matches the filter', async () => {
    vi.mocked(fetchAiJobs).mockResolvedValue(jobsPage([]))
    renderPage()
    expect(await screen.findByText('No generation runs match the filter.')).toBeInTheDocument()
  })

  it('pages through the results from the backend', async () => {
    vi.mocked(fetchAiJobs).mockResolvedValue(jobsPage([SUCCEEDED], { page: 1, pageCount: 3, total: 60 }))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Next/ }))
    await waitFor(() => expect(fetchAiJobs).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
  })

  it('surfaces an API failure', async () => {
    vi.mocked(fetchAiJobs).mockRejectedValue(new Error('Could not load generation logs'))
    renderPage()
    expect(await screen.findByText('Could not load generation logs')).toBeInTheDocument()
  })
})
