import { ja } from '@/shared/i18n/ja'

// Japanese display of dates, times, prices and counts. Rules: docs/copy.md ("표기").
// Events happen in Seoul, so dates and times are always shown in Seoul time (same offset as Japan).

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

function toDate(value: DateInput) {
  return typeof value === 'string' ? new Date(value) : value
}

function dayParts(value: DateInput) {
  const parts = Object.fromEntries(
    dayPartsFormatter.formatToParts(toDate(value)).map((part) => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday ?? '',
  }
}

/** 「11月29日（土）」. With `withYear`: 「2026年11月29日（土）」. */
export function formatDay(value: DateInput, { withYear = false } = {}) {
  const { year, month, day, weekday } = dayParts(value)
  const date = withYear ? ja.format.yearMonthDay(year, month, day) : ja.format.monthDay(month, day)
  return `${date}${ja.format.weekday(weekday)}`
}

/**
 * 「11月1日（土）〜11月30日（日）」. One day only: 「11月29日（土）」.
 * When the range crosses a year, both ends get the year.
 */
export function formatDayRange(start: DateInput, end: DateInput) {
  const withYear = dayParts(start).year !== dayParts(end).year
  const startText = formatDay(start, { withYear })
  const endText = formatDay(end, { withYear })
  return startText === endText ? startText : `${startText}${ja.format.rangeSeparator}${endText}`
}

/** 「18:00」 (24-hour). */
export function formatTime(value: DateInput) {
  return timeFormatter.format(toDate(value))
}

/** 「11月29日（土）18:00」. */
export function formatDateTime(value: DateInput) {
  return `${formatDay(value)}${formatTime(value)}`
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
