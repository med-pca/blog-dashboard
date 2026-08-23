import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../api/aiContent', () => ({
  fetchAiCampaigns: vi.fn(),
  fetchAiStatus: vi.fn(),
  setAiCampaignState: vi.fn(),
  deleteAiCampaign: vi.fn(),
}))
vi.mock('../../../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

import {
  deleteAiCampaign,
  fetchAiCampaigns,
  fetchAiStatus,
  setAiCampaignState,
} from '../../../api/aiContent'
import AiCampaignsAdmin from '../AiCampaignsAdmin'

const CAMPAIGN = {
  id: 'camp-1',
  name: 'Weeknight dinners',
  masterPrompt: 'Simple family recipes for US home cooks.',
  dailyTarget: 40,
  intervalMinutes: 20,
  generationStartHour: 8,
  generationEndHour: 22,
  timezone: 'America/New_York',
  enabled: true,
  status: 'active',
  generatedToday: 12,
  nextGenerationAt: '2026-05-01T18:20:00.000Z',
  queued: 0,
  running: 0,
}

const STATUS = { enabled: true, model: 'gpt-5-nano', dailyMaxPerCampaign: 100, unavailableReason: null }

function renderPage() {
  return render(
    <MemoryRouter>
      <AiCampaignsAdmin />
    </MemoryRouter>,
  )
}

describe('AiCampaignsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiCampaigns).mockResolvedValue([CAMPAIGN])
    vi.mocked(fetchAiStatus).mockResolvedValue(STATUS)
    vi.mocked(setAiCampaignState).mockResolvedValue({ ...CAMPAIGN, enabled: false, status: 'paused' })
    vi.mocked(deleteAiCampaign).mockResolvedValue(undefined)
  })

  it('shows a loading state before the campaigns arrive', () => {
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('lists the campaigns with their plan and today counter', async () => {
    renderPage()
    expect(await screen.findByText('Weeknight dinners')).toBeInTheDocument()
    expect(screen.getByText('12/40')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/08:00–22:00 America\/New_York/)).toBeInTheDocument()
  })

  it('offers a starting point when there are no campaigns yet', async () => {
    vi.mocked(fetchAiCampaigns).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Create the first campaign')).toBeInTheDocument()
  })

  it('explains itself when generation is switched off in the environment', async () => {
    vi.mocked(fetchAiStatus).mockResolvedValue({
      ...STATUS,
      enabled: false,
      unavailableReason: 'AI content generation is disabled (AI_CONTENT_ENABLED is not "true")',
    })
    renderPage()
    expect(await screen.findByText(/Generation is not running/)).toBeInTheDocument()
    // Campaigns stay editable while generation is off.
    expect(screen.getByText('Weeknight dinners')).toBeInTheDocument()
  })

  it('warns when a listed plan does not fit its window', async () => {
    vi.mocked(fetchAiCampaigns).mockResolvedValue([
      { ...CAMPAIGN, generationStartHour: 9, generationEndHour: 17 },
    ])
    renderPage()
    expect(await screen.findByText('Needs 13 h of window')).toBeInTheDocument()
  })

  it('pauses a running campaign from the list', async () => {
    renderPage()
    const pause = await screen.findByLabelText('Pause Weeknight dinners')
    await userEvent.click(pause)
    await waitFor(() => expect(setAiCampaignState).toHaveBeenCalledWith('camp-1', 'pause'))
    expect(await screen.findByText('Paused')).toBeInTheDocument()
  })

  it('resumes a paused campaign from the list', async () => {
    vi.mocked(fetchAiCampaigns).mockResolvedValue([{ ...CAMPAIGN, enabled: false, status: 'paused' }])
    vi.mocked(setAiCampaignState).mockResolvedValue({ ...CAMPAIGN, enabled: true, status: 'active' })
    renderPage()
    await userEvent.click(await screen.findByLabelText('Resume Weeknight dinners'))
    await waitFor(() => expect(setAiCampaignState).toHaveBeenCalledWith('camp-1', 'resume'))
  })

  it('asks before archiving and removes the row afterwards', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    await userEvent.click(await screen.findByLabelText('Archive Weeknight dinners'))
    await waitFor(() => expect(deleteAiCampaign).toHaveBeenCalledWith('camp-1'))
    await waitFor(() => expect(screen.queryByText('Weeknight dinners')).not.toBeInTheDocument())
  })

  it('keeps the campaign when the archive is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    await userEvent.click(await screen.findByLabelText('Archive Weeknight dinners'))
    expect(deleteAiCampaign).not.toHaveBeenCalled()
  })

  it('surfaces an API failure instead of an empty screen', async () => {
    vi.mocked(fetchAiCampaigns).mockRejectedValue(new Error('Could not load campaigns'))
    renderPage()
    expect(await screen.findByText('Could not load campaigns')).toBeInTheDocument()
  })

  it('reports a refused archive without dropping the row', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(deleteAiCampaign).mockRejectedValue(new Error('Could not archive the campaign'))
    renderPage()
    await userEvent.click(await screen.findByLabelText('Archive Weeknight dinners'))
    expect(await screen.findByText('Could not archive the campaign')).toBeInTheDocument()
    expect(screen.getByText('Weeknight dinners')).toBeInTheDocument()
  })
})
