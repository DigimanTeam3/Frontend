// Dates as printed on tickets and badges, always in Seoul time (the events are in Seoul).

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

export interface SeoulDateParts {
  /** "11" */
  month: string
  /** "29" */
  day: string
  /** "SAT" */
  weekday: string
}

export function seoulDateParts(date: Date | string): SeoulDateParts {
  const parts = partsFormatter.formatToParts(typeof date === 'string' ? new Date(date) : date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return { month: pick('month'), day: pick('day'), weekday: pick('weekday').toUpperCase() }
}

/** "11.29" */
export function formatMonthDay(date: Date | string) {
  const { month, day } = seoulDateParts(date)
  return `${month}.${day}`
}
