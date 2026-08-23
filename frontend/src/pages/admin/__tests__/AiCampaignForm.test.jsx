import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}))
vi.mock('../../../api/aiContent', () => ({
  createAiCampaign: vi.fn(),
  updateAiCampaign: vi.fn(),
  fetchAiCampaign: vi.fn(),
  fetchAiStatus: vi.fn(),
}))
vi.mock('../../../api/projects', () => ({
  fetchProjects: vi.fn(() => Promise.resolve([
    { id: '11111111-1111-4111-8111-111111111111', name: 'Weeknight Dinners', category: 'Family Meals' },
  ])),
}))

import {
  createAiCampaign,
  fetchAiCampaign,
  fetchAiStatus,
  updateAiCampaign,
} from '../../../api/aiContent'
import AiCampaignForm from '../AiCampaignForm'

const PROMPT = 'Write simple, budget-friendly family recipes in English for US home cooks.'

function renderForm(path = '/rnl-panel/ai-kampanyalar/yeni') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/rnl-panel/ai-kampanyalar/yeni" element={<AiCampaignForm />} />
        <Route path="/rnl-panel/ai-kampanyalar/:id/duzenle" element={<AiCampaignForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillValidBrief() {
  await userEvent.type(screen.getByLabelText('Name *'), 'Weeknight dinners')
  await userEvent.selectOptions(screen.getByLabelText('Collection *'), '11111111-1111-4111-8111-111111111111')
  await userEvent.type(screen.getByLabelText('Main instruction *'), PROMPT)
}

async function setNumber(label, value) {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, String(value))
}

describe('AiCampaignForm — creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiStatus).mockResolvedValue({ dailyMaxPerCampaign: 100, enabled: true, unavailableReason: null })
    vi.mocked(createAiCampaign).mockResolvedValue({ id: 'camp-1' })
  })

  it('starts from the documented defaults', async () => {
    renderForm()
    expect(screen.getByLabelText('Articles per day')).toHaveValue(2)
    expect(screen.getByLabelText('Interval (minutes)')).toHaveValue(20)
    expect(screen.getByLabelText('Target length (words)')).toHaveValue(1200)
    await waitFor(() => expect(screen.getByText('Server cap: 100')).toBeInTheDocument())
  })

  it('sends the brief and goes to the new campaign', async () => {
    renderForm()
    await fillValidBrief()
    await setNumber('Articles per day', 40)
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    await waitFor(() => expect(createAiCampaign).toHaveBeenCalled())
    expect(vi.mocked(createAiCampaign).mock.calls[0][0]).toMatchObject({
      name: 'Weeknight dinners',
      collectionId: '11111111-1111-4111-8111-111111111111',
      masterPrompt: PROMPT,
      dailyTarget: 40,
      intervalMinutes: 20,
      enabled: false,
    })
    expect(navigate).toHaveBeenCalledWith('/rnl-panel/ai-kampanyalar/camp-1')
  })

  it('splits the keyword field into a trimmed list', async () => {
    renderForm()
    await fillValidBrief()
    await userEvent.type(screen.getByLabelText(/Keywords/), ' weeknight , budget meals ,, ')
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    await waitFor(() => expect(createAiCampaign).toHaveBeenCalled())
    expect(vi.mocked(createAiCampaign).mock.calls[0][0].keywords).toEqual(['weeknight', 'budget meals'])
  })

  it('refuses an empty name', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Main instruction *'), PROMPT)
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  it('refuses a main instruction that says nothing', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Name *'), 'Weeknight dinners')
    await userEvent.selectOptions(screen.getByLabelText('Collection *'), '11111111-1111-4111-8111-111111111111')
    await userEvent.type(screen.getByLabelText('Main instruction *'), 'too short')
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    expect(await screen.findByText(/at least 20 characters/)).toBeInTheDocument()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  it('requires a collection before creating a campaign', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Name *'), 'Weeknight dinners')
    await userEvent.type(screen.getByLabelText('Main instruction *'), PROMPT)
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    expect(await screen.findByText('A collection is required.')).toBeInTheDocument()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  // The number inputs carry min/max, so the browser blocks these submits before
  // the handler runs; the handler re-checks them anyway as a second line.
  it('refuses a daily target above the server cap', async () => {
    vi.mocked(fetchAiStatus).mockResolvedValue({ dailyMaxPerCampaign: 25, enabled: true, unavailableReason: null })
    renderForm()
    await waitFor(() => expect(screen.getByText('Server cap: 25')).toBeInTheDocument())
    await fillValidBrief()
    await setNumber('Articles per day', 40)
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    expect(screen.getByLabelText('Articles per day')).toBeInvalid()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  it('refuses an interval below five minutes', async () => {
    renderForm()
    await fillValidBrief()
    await setNumber('Interval (minutes)', 2)
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    expect(screen.getByLabelText('Interval (minutes)')).toBeInvalid()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  // An empty number input is valid to the browser but means "0 articles" to us.
  it('catches a cleared daily target in the handler', async () => {
    vi.mocked(fetchAiStatus).mockResolvedValue({ dailyMaxPerCampaign: 25, enabled: true, unavailableReason: null })
    renderForm()
    await waitFor(() => expect(screen.getByText('Server cap: 25')).toBeInTheDocument())
    await fillValidBrief()
    await userEvent.clear(screen.getByLabelText('Articles per day'))
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    expect(await screen.findByText('Articles per day must be between 1 and 25.')).toBeInTheDocument()
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  it('refuses a window whose end is not after its start', async () => {
    renderForm()
    await fillValidBrief()
    await userEvent.selectOptions(screen.getByLabelText('Start hour'), '22')
    await userEvent.selectOptions(screen.getByLabelText('End hour'), '6')
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    expect(await screen.findByText('The start hour must be earlier than the end hour.')).toBeInTheDocument()
  })

  it('shows the API error rather than pretending it saved', async () => {
    vi.mocked(createAiCampaign).mockRejectedValue(new Error('dailyTarget cannot exceed AI_DAILY_MAX_PER_CAMPAIGN (100)'))
    renderForm()
    await fillValidBrief()
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    expect(await screen.findByText(/cannot exceed AI_DAILY_MAX_PER_CAMPAIGN/)).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe('AiCampaignForm — live schedule read-out', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiStatus).mockResolvedValue({ dailyMaxPerCampaign: 100, enabled: true, unavailableReason: null })
  })

  it('computes the minimum run time as the inputs change', async () => {
    renderForm()
    await setNumber('Articles per day', 40)
    await waitFor(() =>
      expect(screen.getByTestId('plan-summary')).toHaveTextContent(
        '40 articles × 20 min needs 13 h · window offers 14 h',
      ),
    )
    expect(screen.getByText(/Last article would start around 21:00 local time/)).toBeInTheDocument()
  })

  it('stays silent while the plan fits the window', async () => {
    renderForm()
    await setNumber('Articles per day', 40)
    await waitFor(() => expect(screen.getByTestId('plan-summary')).toHaveTextContent('needs 13 h'))
    expect(screen.queryByTestId('plan-warning')).not.toBeInTheDocument()
  })

  it('warns and suggests a fix when the window is too short', async () => {
    renderForm()
    await setNumber('Articles per day', 40)
    await userEvent.selectOptions(screen.getByLabelText('Start hour'), '9')
    await userEvent.selectOptions(screen.getByLabelText('End hour'), '17')

    const warning = await screen.findByTestId('plan-warning')
    expect(warning).toHaveTextContent('needs 13 h between the first and last article')
    expect(warning).toHaveTextContent('window only offers 8 h')
    expect(warning).toHaveTextContent('lower the interval to 12 min')
  })

  it('still lets the campaign be saved after the warning — it is advisory', async () => {
    vi.mocked(createAiCampaign).mockResolvedValue({ id: 'camp-1' })
    renderForm()
    await fillValidBrief()
    await setNumber('Articles per day', 40)
    await userEvent.selectOptions(screen.getByLabelText('Start hour'), '9')
    await userEvent.selectOptions(screen.getByLabelText('End hour'), '17')
    await screen.findByTestId('plan-warning')
    await userEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))
    await waitFor(() => expect(createAiCampaign).toHaveBeenCalled())
  })
})

describe('AiCampaignForm — editing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAiStatus).mockResolvedValue({ dailyMaxPerCampaign: 100, enabled: true, unavailableReason: null })
    vi.mocked(fetchAiCampaign).mockResolvedValue({
      id: 'camp-1',
      name: 'Weeknight dinners',
      collectionId: '11111111-1111-4111-8111-111111111111',
      masterPrompt: PROMPT,
      language: 'English',
      tone: 'friendly and practical',
      targetWords: 1500,
      keywords: ['weeknight', 'budget'],
      dailyTarget: 40,
      intervalMinutes: 20,
      generationStartHour: 8,
      generationEndHour: 22,
      timezone: 'America/New_York',
      enabled: true,
    })
    vi.mocked(updateAiCampaign).mockResolvedValue({ id: 'camp-1' })
  })

  it('loads the campaign into the form', async () => {
    renderForm('/rnl-panel/ai-kampanyalar/camp-1/duzenle')
    expect(await screen.findByDisplayValue('Weeknight dinners')).toBeInTheDocument()
    expect(screen.getByLabelText(/Keywords/)).toHaveValue('weeknight, budget')
    expect(screen.getByLabelText('Articles per day')).toHaveValue(40)
    expect(screen.getByRole('switch', { name: 'Campaign active' })).toHaveAttribute('aria-checked', 'true')
  })

  it('saves changes through the update endpoint', async () => {
    renderForm('/rnl-panel/ai-kampanyalar/camp-1/duzenle')
    await screen.findByDisplayValue('Weeknight dinners')
    await setNumber('Interval (minutes)', 30)
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(updateAiCampaign).toHaveBeenCalled())
    expect(vi.mocked(updateAiCampaign).mock.calls[0][1].intervalMinutes).toBe(30)
    expect(createAiCampaign).not.toHaveBeenCalled()
  })

  it('toggles the active switch', async () => {
    renderForm('/rnl-panel/ai-kampanyalar/camp-1/duzenle')
    await screen.findByDisplayValue('Weeknight dinners')
    await userEvent.click(screen.getByRole('switch', { name: 'Campaign active' }))
    expect(screen.getByRole('switch', { name: 'Campaign active' })).toHaveAttribute('aria-checked', 'false')
  })
})
