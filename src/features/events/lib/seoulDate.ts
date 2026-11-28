// Dates on the event screens are always Seoul dates, whatever the phone's time zone is.
const SEOUL = 'Asia/Seoul'

const dayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: SEOUL,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

function seoulParts(date: Date) {
  const parts = Object.fromEntries(dayParts.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: parts.year ?? '',
    month: parts.month ?? '',
    day: parts.day ?? '',
    weekday: parts.weekday ?? '',
  }
}

/** 「2026-11-27」: the API date format (YYYY-MM-DD, Seoul). */
export function seoulDateString(date = new Date()) {
  const { year, month, day } = seoulParts(date)
  return `${year}-${month}-${day}`
}

/** 「2026.11.27 FRI」 for the home header. */
export function seoulHeaderDate(date = new Date()) {
  const { year, month, day, weekday } = seoulParts(date)
  return `${year}.${month}.${day} ${weekday.toUpperCase()}`
}

/** 「11.29」, or 「2027.05.30」 with `withYear`. */
export function seoulMonthDay(date: Date, withYear = false) {
  const { year, month, day } = seoulParts(date)
  return withYear ? `${year}.${month}.${day}` : `${month}.${day}`
}

/** Seoul year, e.g. 「2026」. */
export function seoulYear(date: Date) {
  return seoulParts(date).year
}

/** Day of the week of a Seoul date, 0 = Sunday … 6 = Saturday. */
export function seoulWeekday(date = new Date()) {
  const [year, month, day] = seoulDateString(date).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** 「2026-11-27」 + 2 days → 「2026-11-29」 (calendar arithmetic, no time zone involved). */
export function addDays(ymd: string, days: number) {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** Last day of the month of a YYYY-MM-DD date. */
export function endOfMonth(ymd: string) {
  const [year, month] = ymd.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}
