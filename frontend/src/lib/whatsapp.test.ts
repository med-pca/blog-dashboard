import { describe, expect, it } from 'vitest'
import { WA_NUMBER, waLink } from './whatsapp'

describe('waLink', () => {
  it('builds a wa.me link to the configured number', () => {
    expect(waLink('hello')).toBe(`https://wa.me/${WA_NUMBER}?text=hello`)
  })

  it('URL-encodes the message', () => {
    const link = waLink('Hi, I would like a quote & more details')
    expect(link).toContain(`wa.me/${WA_NUMBER}?text=`)
    expect(link).toContain(encodeURIComponent('&'))
    expect(link).not.toContain(' ')
  })

  it('safely carries a multi-line summary message', () => {
    const message = 'Hi,\n\nTopic of interest: Weeknight Dinners\nI would like more details.'
    expect(waLink(message)).toBe(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`)
  })
})
