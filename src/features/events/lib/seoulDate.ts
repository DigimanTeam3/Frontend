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

/** 「11.29」 */
export function seoulMonthDay(date: Date) {
  const { month, day } = seoulParts(date)
  return `${month}.${day}`
}
