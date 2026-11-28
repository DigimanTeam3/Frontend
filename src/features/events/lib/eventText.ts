import type { EventCategory } from '@/shared/types/event'
import { ja } from '@/shared/i18n/ja'

/** Japanese text first, original (Korean) text when there is no translation. */
export function preferJa(jaText: string | null, original: string): string
export function preferJa(jaText: string | null, original: string | null): string | null
export function preferJa(jaText: string | null, original: string | null) {
  return jaText ?? original
}

export function categoryLabel(category: EventCategory) {
  return ja.eventCategory[category]
}

export type EventStatus = 'upcoming' | 'ongoing' | 'ended'

export function eventStatus(startIso: string, endIso: string, now = new Date()): EventStatus {
  if (now < new Date(startIso)) return 'upcoming'
  if (now > new Date(endIso)) return 'ended'
  return 'ongoing'
}

const dayFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
})
const yearFormatter = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Seoul', year: 'numeric' })

function formatDay(date: Date, withYear: boolean) {
  const day = `${dayFormatter.format(date)}（${weekdayFormatter.format(date)}）`
  return withYear ? `${yearFormatter.format(date)}${day}` : day
}

/** 「11月1日（土）– 11月30日（日）」. Adds the year to the end date when the year changes. */
export function formatEventPeriod(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const startText = formatDay(start, false)
  const crossesYear = yearFormatter.format(start) !== yearFormatter.format(end)
  const endText = formatDay(end, crossesYear)
  return startText === endText ? startText : `${startText} – ${endText}`
}
