import {
  addLocalDays,
  clampIntoWindow,
  computeNextGenerationAt,
  evaluateWindow,
  isValidTimezone,
  isWithinWindow,
  localDateKey,
  localMinutesOfDay,
  nextDayWindowStart,
  zonedWallTimeToUtc,
} from '../lib/schedule'

const NY = { generationStartHour: 8, generationEndHour: 22, timezone: 'America/New_York' }

describe('timezone helpers', () => {
  it('accepts IANA zones and rejects anything else', () => {
    expect(isValidTimezone('Europe/Istanbul')).toBe(true)
    expect(isValidTimezone('UTC')).toBe(true)
    expect(isValidTimezone('Mars/Olympus')).toBe(false)
    expect(isValidTimezone('')).toBe(false)
  })

  it('reports the local calendar day, not the server day', () => {
    // 03:30 UTC is still the previous evening in New York.
    const at = new Date('2026-03-10T03:30:00Z')
    expect(localDateKey(at, 'UTC')).toBe('2026-03-10')
    expect(localDateKey(at, 'America/New_York')).toBe('2026-03-09')
    expect(localMinutesOfDay(at, 'America/New_York')).toBe(23 * 60 + 30)
  })

  it('converts a local wall time back to the right instant across a DST jump', () => {
    // US DST starts 2026-03-08: EST (-5) before, EDT (-4) after.
    expect(zonedWallTimeToUtc('2026-03-07', 8, 0, 'America/New_York').toISOString()).toBe('2026-03-07T13:00:00.000Z')
    expect(zonedWallTimeToUtc('2026-03-09', 8, 0, 'America/New_York').toISOString()).toBe('2026-03-09T12:00:00.000Z')
  })

  it('adds local days across a month boundary', () => {
    expect(addLocalDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addLocalDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('generation window', () => {
  it('knows when the window is open in the campaign timezone', () => {
    expect(isWithinWindow(new Date('2026-05-01T13:00:00Z'), NY)).toBe(true) // 09:00 local
    expect(isWithinWindow(new Date('2026-05-01T05:00:00Z'), NY)).toBe(false) // 01:00 local
  })

  it('treats end hour 24 as local midnight', () => {
    const allEvening = { generationStartHour: 0, generationEndHour: 24, timezone: 'UTC' }
    expect(isWithinWindow(new Date('2026-05-01T23:59:00Z'), allEvening)).toBe(true)
    expect(isWithinWindow(new Date('2026-05-01T00:00:00Z'), allEvening)).toBe(true)
  })

  it('pushes an instant before the window to today opening and after it to tomorrow', () => {
    const beforeOpen = clampIntoWindow(new Date('2026-05-01T09:00:00Z'), NY) // 05:00 local
    expect(beforeOpen.toISOString()).toBe('2026-05-01T12:00:00.000Z') // 08:00 EDT

    const afterClose = clampIntoWindow(new Date('2026-05-02T03:00:00Z'), NY) // 23:00 local May 1
    expect(afterClose.toISOString()).toBe('2026-05-02T12:00:00.000Z') // 08:00 EDT May 2
  })

  it('leaves an instant inside the window untouched', () => {
    const inside = new Date('2026-05-01T15:23:00Z')
    expect(clampIntoWindow(inside, NY).toISOString()).toBe(inside.toISOString())
  })

  it('parks a spent campaign on the next local opening', () => {
    expect(nextDayWindowStart(new Date('2026-05-01T15:00:00Z'), NY).toISOString()).toBe('2026-05-02T12:00:00.000Z')
  })
})

describe('computeNextGenerationAt', () => {
  const schedule = { ...NY, dailyTarget: 40, intervalMinutes: 20 }

  it('adds exactly one interval while the window stays open', () => {
    const next = computeNextGenerationAt(new Date('2026-05-01T15:00:00Z'), schedule)
    expect(next.toISOString()).toBe('2026-05-01T15:20:00.000Z')
  })

  it('never replays a backlog: one interval from now, not from the missed slot', () => {
    // Backend was down for five hours; "now" is what matters.
    const now = new Date('2026-05-01T18:00:00Z')
    const next = computeNextGenerationAt(now, schedule)
    expect(next.getTime() - now.getTime()).toBe(20 * 60_000)
  })

  it('rolls to the next opening when the interval crosses the closing hour', () => {
    const next = computeNextGenerationAt(new Date('2026-05-02T01:50:00Z'), schedule) // 21:50 local
    expect(next.toISOString()).toBe('2026-05-02T12:00:00.000Z')
  })
})

describe('evaluateWindow', () => {
  it('computes the 40 x 20 minutes case from the brief', () => {
    const result = evaluateWindow({ ...NY, dailyTarget: 40, intervalMinutes: 20 })
    expect(result.requiredMinutes).toBe(780) // (40 - 1) * 20
    expect(result.availableMinutes).toBe(840) // 08:00 -> 22:00
    expect(result.fits).toBe(true)
    expect(result.lastStartLabel).toBe('21:00')
  })

  it('flags a window that is too short and suggests a workable interval', () => {
    const result = evaluateWindow({
      generationStartHour: 9,
      generationEndHour: 17,
      timezone: 'UTC',
      dailyTarget: 40,
      intervalMinutes: 20,
    })
    expect(result.requiredMinutes).toBe(780)
    expect(result.availableMinutes).toBe(480)
    expect(result.fits).toBe(false)
    expect(result.maxArticlesInWindow).toBe(25)
    expect(result.suggestedIntervalMinutes).toBe(12)
  })

  it('needs no spacing at all for a single daily article', () => {
    const result = evaluateWindow({ ...NY, dailyTarget: 1, intervalMinutes: 20 })
    expect(result.requiredMinutes).toBe(0)
    expect(result.fits).toBe(true)
  })
})
