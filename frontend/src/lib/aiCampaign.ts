// Schedule maths for the AI campaign form. Mirrors backend
// src/ai-content/lib/schedule.ts so the panel can warn about an impossible
// plan before the request is sent; the backend stays the authority.

export interface CampaignSchedule {
  dailyTarget: number
  intervalMinutes: number
  generationStartHour: number
  generationEndHour: number
}

export interface ScheduleFeasibility {
  requiredMinutes: number
  availableMinutes: number
  fits: boolean
  lastStartLabel: string
  maxArticlesInWindow: number
  suggestedIntervalMinutes: number
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}

// (dailyTarget - 1) x intervalMinutes has to fit between the first and the last
// launch of the day. Generation time itself is on top of that, which is why the
// last-launch clock time is shown next to the verdict.
export function evaluateSchedule(schedule: CampaignSchedule): ScheduleFeasibility {
  const dailyTarget = Math.max(1, Number(schedule.dailyTarget) || 1)
  const intervalMinutes = Math.max(1, Number(schedule.intervalMinutes) || 1)
  const start = Number(schedule.generationStartHour) || 0
  const end = Number(schedule.generationEndHour) || 0

  const requiredMinutes = (dailyTarget - 1) * intervalMinutes
  const availableMinutes = Math.max(0, (end - start) * 60)
  const lastStartMinutes = start * 60 + requiredMinutes

  return {
    requiredMinutes,
    availableMinutes,
    fits: requiredMinutes <= availableMinutes,
    lastStartLabel: `${pad(Math.floor(lastStartMinutes / 60) % 24)}:${pad(lastStartMinutes % 60)}`,
    maxArticlesInWindow: Math.floor(availableMinutes / intervalMinutes) + 1,
    suggestedIntervalMinutes: dailyTarget > 1 ? Math.floor(availableMinutes / (dailyTarget - 1)) : intervalMinutes,
  }
}

// Human-readable warning shown under the form, or null when the plan fits.
export function scheduleWarning(schedule: CampaignSchedule): string | null {
  const result = evaluateSchedule(schedule)
  if (result.fits) return null
  const suggestion =
    result.suggestedIntervalMinutes >= 5
      ? `lower the interval to ${result.suggestedIntervalMinutes} min`
      : `lower the daily count to ${result.maxArticlesInWindow}`
  return (
    `This plan needs ${formatDuration(result.requiredMinutes)} between the first and last article, ` +
    `but the window only offers ${formatDuration(result.availableMinutes)}. ` +
    `Widen the window, ${suggestion}, or reduce the daily count.`
  )
}

// The zones offered in the form. Anything else can still be typed; the backend
// validates against the full IANA database.
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
]

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
