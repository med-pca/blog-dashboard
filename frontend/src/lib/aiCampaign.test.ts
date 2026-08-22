import { describe, expect, it } from 'vitest'
import { COMMON_TIMEZONES, evaluateSchedule, formatDuration, scheduleWarning } from './aiCampaign'

const WIDE = { generationStartHour: 8, generationEndHour: 22 }

describe('evaluateSchedule', () => {
  it('computes the 40 x 20 minutes plan from the brief', () => {
    const result = evaluateSchedule({ ...WIDE, dailyTarget: 40, intervalMinutes: 20 })
    expect(result.requiredMinutes).toBe(780) // (40 - 1) * 20
    expect(result.availableMinutes).toBe(840) // 08:00 -> 22:00
    expect(result.fits).toBe(true)
    expect(result.lastStartLabel).toBe('21:00')
  })

  it('flags a window that cannot hold the plan', () => {
    const result = evaluateSchedule({
      generationStartHour: 9,
      generationEndHour: 17,
      dailyTarget: 40,
      intervalMinutes: 20,
    })
    expect(result.fits).toBe(false)
    expect(result.availableMinutes).toBe(480)
    expect(result.maxArticlesInWindow).toBe(25)
    expect(result.suggestedIntervalMinutes).toBe(12)
  })

  it('needs no spacing for a single article a day', () => {
    const result = evaluateSchedule({ ...WIDE, dailyTarget: 1, intervalMinutes: 20 })
    expect(result.requiredMinutes).toBe(0)
    expect(result.fits).toBe(true)
  })

  it('survives the empty strings a partially filled form produces', () => {
    const result = evaluateSchedule({
      dailyTarget: '' as unknown as number,
      intervalMinutes: '' as unknown as number,
      generationStartHour: '' as unknown as number,
      generationEndHour: '' as unknown as number,
    })
    expect(result.requiredMinutes).toBe(0)
    expect(result.availableMinutes).toBe(0)
    expect(result.fits).toBe(true)
  })

  it('matches the backend when the strings come from number inputs', () => {
    const asStrings = evaluateSchedule({
      dailyTarget: '40' as unknown as number,
      intervalMinutes: '20' as unknown as number,
      generationStartHour: '8' as unknown as number,
      generationEndHour: '22' as unknown as number,
    })
    expect(asStrings).toEqual(evaluateSchedule({ ...WIDE, dailyTarget: 40, intervalMinutes: 20 }))
  })
})

describe('scheduleWarning', () => {
  it('is silent when the plan fits', () => {
    expect(scheduleWarning({ ...WIDE, dailyTarget: 40, intervalMinutes: 20 })).toBeNull()
  })

  it('states both durations and suggests a way out', () => {
    const warning = scheduleWarning({
      generationStartHour: 9,
      generationEndHour: 17,
      dailyTarget: 40,
      intervalMinutes: 20,
    })
    expect(warning).toContain('13 h')
    expect(warning).toContain('8 h')
    expect(warning).toContain('lower the interval to 12 min')
  })

  it('suggests fewer articles when no legal interval would help', () => {
    const warning = scheduleWarning({
      generationStartHour: 9,
      generationEndHour: 10,
      dailyTarget: 40,
      intervalMinutes: 20,
    })
    expect(warning).toContain('lower the daily count to 4')
  })
})

describe('formatDuration', () => {
  it('reads as hours and minutes', () => {
    expect(formatDuration(780)).toBe('13 h')
    expect(formatDuration(800)).toBe('13 h 20 min')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(0)).toBe('0 min')
  })
})

describe('COMMON_TIMEZONES', () => {
  it('only offers zones the browser can resolve', () => {
    for (const zone of COMMON_TIMEZONES) {
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: zone })).not.toThrow()
    }
  })
})
