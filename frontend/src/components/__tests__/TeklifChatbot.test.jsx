import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeklifChatbot from '../TeklifChatbot'
import { sendChatMessage, submitChatRating, trackChatOpen } from '../../api/chat'

vi.mock('../../api/chat', () => ({
  sendChatMessage: vi.fn(),
  submitChatRating: vi.fn(),
  trackChatOpen: vi.fn(),
}))

const SESSION = '3f2b8c1a-9d4e-4f6a-8b2c-1d3e5f7a9b0c'

function renderChatbot(props = {}) {
  const onClose = vi.fn()
  render(<TeklifChatbot onClose={onClose} sessionId={SESSION} {...props} />)
  return { onClose }
}

async function sendUserMessage(user, text) {
  await user.type(screen.getByPlaceholderText('Type your message...'), text)
  await user.click(screen.getByLabelText('Send'))
}

beforeEach(() => {
  // The api module is mocked once for the file: call counts must not leak between tests.
  vi.clearAllMocks()
  sessionStorage.clear()
  vi.mocked(sendChatMessage).mockResolvedValue({ reply: 'Roast them at 220 C for 25 minutes.' })
  vi.mocked(submitChatRating).mockResolvedValue(undefined)
  vi.mocked(trackChatOpen).mockReturnValue(undefined)
})

describe('TeklifChatbot — on-site assistant', () => {
  it('answers in the chat and keeps the exchange visible', async () => {
    const user = userEvent.setup()
    renderChatbot()

    await sendUserMessage(user, 'What temperature for roast vegetables?')

    expect(await screen.findByText('Roast them at 220 C for 25 minutes.')).toBeInTheDocument()
    expect(screen.getByText('What temperature for roast vegetables?')).toBeInTheDocument()
    expect(sendChatMessage).toHaveBeenCalledWith('What temperature for roast vegetables?', SESSION)
  })

  it('restores an existing conversation and reports every change back', async () => {
    const user = userEvent.setup()
    const onMessagesChange = vi.fn()
    renderChatbot({
      messages: [
        { role: 'user', content: 'quick dinner?' },
        { role: 'assistant', content: 'Try a sheet-pan chicken.' },
      ],
      onMessagesChange,
    })

    expect(screen.getByText('Try a sheet-pan chicken.')).toBeInTheDocument()

    await sendUserMessage(user, 'and a side?')
    await waitFor(() => expect(onMessagesChange).toHaveBeenCalled())
    const lastState = onMessagesChange.mock.calls.at(-1)[0]
    expect(lastState).toHaveLength(4)
  })

  it('offers no handoff button, whatever the assistant replies', async () => {
    const user = userEvent.setup()
    // Even a reply that names the retired channel must not resurrect a button.
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: 'I cannot reach you on WhatsApp, but here is the recipe.' })
    renderChatbot()

    await sendUserMessage(user, 'can we continue elsewhere?')
    await screen.findByText(/here is the recipe/)

    expect(screen.queryByRole('button', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue on/i })).not.toBeInTheDocument()
    const buttonLabels = screen.getAllByRole('button').map(b => b.textContent ?? '')
    expect(buttonLabels.join(' ')).not.toMatch(/whatsapp/i)
  })

  it('falls back to on-site guidance when the request fails, with no invented contact method', async () => {
    const user = userEvent.setup()
    vi.mocked(sendChatMessage).mockRejectedValue(new Error('network down'))
    renderChatbot()

    await sendUserMessage(user, 'help')

    const fallback = await screen.findByText(/unable to prepare a complete response/i)
    expect(fallback).toHaveTextContent(/contact page/i)
    expect(fallback).not.toHaveTextContent(/whatsapp/i)
    expect(fallback).not.toHaveTextContent(/\d{3,}/) // no phone number
  })

  it('still asks for a rating when the reader closes after two messages', async () => {
    const user = userEvent.setup()
    const { onClose } = renderChatbot()

    await sendUserMessage(user, 'first question')
    await screen.findByText('Roast them at 220 C for 25 minutes.')
    await sendUserMessage(user, 'second question')
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2))

    await user.click(screen.getByLabelText('Close'))
    expect(await screen.findByText('Would you rate this chat?')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByLabelText('4 stars'))
    expect(submitChatRating).toHaveBeenCalledWith(4, SESSION)
    expect(await screen.findByText('Thank you!')).toBeInTheDocument()
  })

  it('shows nothing about WhatsApp on the opening screen', () => {
    renderChatbot()
    expect(document.body.textContent).not.toMatch(/whatsapp/i)
    expect(document.body.textContent).not.toMatch(/continue on/i)
    expect(document.body.textContent).not.toMatch(/kitchen team/i)
  })
})
