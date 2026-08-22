// Timezone-aware scheduling maths. No date library: everything is derived from
// Intl, so the campaign's own IANA zone drives the daily reset and the
// generation window regardless of the server's clock.

export interface GenerationWindow {
  generationStartHour: number
  generationEndHour: number
  timezone: string
}

export interface CampaignSchedule extends GenerationWindow {
  dailyTarget: number
  intervalMinutes: number
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

export function isValidTimezone(timezone: string): boolean {
  if (typeof timezone !== 'string' || timezone.trim() === '') return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

function parts(at: Date, timezone: string): Record<string, number> {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const out: Record<string, number> = {}
  for (const part of formatted) {
    if (part.type !== 'literal') out[part.type] = Number(part.value)
  }
  return out
}

// Offset of `timezone` at the given instant, in milliseconds (east of UTC is positive).
export function zoneOffsetMs(at: Date, timezone: string): number {
  const p = parts(at, timezone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(at.getTime() / 1000) * 1000
}

// Local calendar day as YYYY-MM-DD — the key the daily counter resets on.
export function localDateKey(at: Date, timezone: string): string {
  const p = parts(at, timezone)
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function localMinutesOfDay(at: Date, timezone: string): number {
  const p = parts(at, timezone)
  return p.hour * 60 + p.minute
}

export function addLocalDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS)
  return shifted.toISOString().slice(0, 10)
}

// Wall-clock time in `timezone` back to a UTC instant. Two passes so the
// result stays correct across a DST boundary (the first guess picks the wrong
// offset only when the jump happens between guess and result).
export function zonedWallTimeToUtc(dateKey: string, hour: number, minute: number, timezone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const firstOffset = zoneOffsetMs(guess, timezone)
  const candidate = new Date(guess.getTime() - firstOffset)
  const secondOffset = zoneOffsetMs(candidate, timezone)
  if (secondOffset === firstOffset) return candidate
  return new Date(guess.getTime() - secondOffset)
}

export function isWithinWindow(at: Date, window: GenerationWindow): boolean {
  const minutes = localMinutesOfDay(at, window.timezone)
  return minutes >= window.generationStartHour * 60 && minutes < window.generationEndHour * 60
}

// First opening at or after `at`. Today's opening when the window has not
// started yet, tomorrow's once it has closed, `at` itself while it is open.
export function clampIntoWindow(at: Date, window: GenerationWindow): Date {
  const minutes = localMinutesOfDay(at, window.timezone)
  const dateKey = localDateKey(at, window.timezone)
  if (minutes < window.generationStartHour * 60) {
    return zonedWallTimeToUtc(dateKey, window.generationStartHour, 0, window.timezone)
  }
  if (minutes >= window.generationEndHour * 60) {
    return zonedWallTimeToUtc(addLocalDays(dateKey, 1), window.generationStartHour, 0, window.timezone)
  }
  return at
}

// Opening of the next local day's window — used when today's quota is spent.
export function nextDayWindowStart(at: Date, window: GenerationWindow): Date {
  const dateKey = localDateKey(at, window.timezone)
  return zonedWallTimeToUtc(addLocalDays(dateKey, 1), window.generationStartHour, 0, window.timezone)
}

// One interval after `from`, pushed into the window when it lands outside it.
export function computeNextGenerationAt(from: Date, schedule: CampaignSchedule): Date {
  const candidate = new Date(from.getTime() + schedule.intervalMinutes * MINUTE_MS)
  return clampIntoWindow(candidate, schedule)
}

export interface WindowFeasibility {
  requiredMinutes: number
  availableMinutes: number
  fits: boolean
  // Local clock time of the last launch when the target is met back to back.
  lastStartLabel: string
  maxArticlesInWindow: number
  suggestedIntervalMinutes: number
}

function label(minutesOfDay: number): string {
  const hour = Math.floor(minutesOfDay / 60) % 24
  const minute = minutesOfDay % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// (dailyTarget - 1) x intervalMinutes has to fit between the first and the last
// launch. Generation time itself is extra, which is why the UI also shows the
// last launch time rather than a bare boolean.
export function evaluateWindow(schedule: CampaignSchedule): WindowFeasibility {
  const requiredMinutes = Math.max(0, (schedule.dailyTarget - 1) * schedule.intervalMinutes)
  const availableMinutes = Math.max(0, (schedule.generationEndHour - schedule.generationStartHour) * 60)
  const lastStartMinutes = schedule.generationStartHour * 60 + requiredMinutes
  return {
    requiredMinutes,
    availableMinutes,
    fits: requiredMinutes <= availableMinutes,
    lastStartLabel: label(lastStartMinutes),
    maxArticlesInWindow: Math.floor(availableMinutes / schedule.intervalMinutes) + 1,
    suggestedIntervalMinutes:
      schedule.dailyTarget > 1 ? Math.floor(availableMinutes / (schedule.dailyTarget - 1)) : schedule.intervalMinutes,
  }
}
