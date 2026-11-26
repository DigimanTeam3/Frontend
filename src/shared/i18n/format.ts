import { ja } from '@/shared/i18n/ja'

// Japanese display of dates, times, prices and counts. Rules: docs/copy.md ("표기").
// Events happen in Seoul, so dates and times are always shown in Seoul time (same offset as Japan).
// Input is ISO 8601 with an offset ("2026-11-29T10:00:00+09:00") or a Date.
// An invalid date gives '' instead of throwing, so one bad value does not break the screen.

const TIME_ZONE = 'Asia/Seoul'

const dayPartsFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
})
const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const numberFormatter = new Intl.NumberFormat('ja-JP')

type DateInput = string | Date

function toDate(value: DateInput): Date | null {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

type DayParts = { year: number; month: number; day: number; weekday: string }

function dayParts(date: Date): DayParts {
  const parts = Object.fromEntries(
    dayPartsFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday ?? '',
  }
}

/** 「11月29日（日）」. With `withYear`: 「2026年11月29日（日）」. */
export function formatDay(value: DateInput, { withYear = false } = {}) {
  const date = toDate(value)
  return date ? dayText(dayParts(date), withYear) : ''
}

function dayText({ year, month, day, weekday }: DayParts, withYear: boolean) {
  const date = withYear ? ja.format.yearMonthDay(year, month, day) : ja.format.monthDay(month, day)
  return `${date}${ja.format.weekday(weekday)}`
}

/**
 * 「11月1日（日）〜11月30日（月）」. One day only: 「11月29日（日）」.
 * When the range crosses a year, both ends get the year.
 */
export function formatDayRange(start: DateInput, end: DateInput) {
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (!startDate || !endDate)
    return startDate ? formatDay(startDate) : endDate ? formatDay(endDate) : ''
  const startParts = dayParts(startDate)
  const endParts = dayParts(endDate)
  const withYear = startParts.year !== endParts.year
  const startText = dayText(startParts, withYear)
  const endText = dayText(endParts, withYear)
  return startText === endText ? startText : `${startText}${ja.format.rangeSeparator}${endText}`
}

/** 「18:00」 (24-hour). */
export function formatTime(value: DateInput) {
  const date = toDate(value)
  return date ? timeFormatter.format(date) : ''
}

/** 「11月29日（日）18:00」. */
export function formatDateTime(value: DateInput) {
  const date = toDate(value)
  return date ? `${formatDay(date)}${formatTime(date)}` : ''
}

/** Price in won: 0 → 「無料」, 5000 → 「5,000ウォン」. */
export function formatPrice(won: number) {
  return won === 0 ? ja.common.free : ja.format.won(numberFormatter.format(won))
}

/** 「3件」 (posts, results). */
export function formatCount(count: number) {
  return ja.format.count(numberFormatter.format(count))
}

/** 「2人」 (people). */
export function formatPeople(count: number) {
  return ja.format.people(numberFormatter.format(count))
}
