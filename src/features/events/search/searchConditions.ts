import type { EventListParams } from '@/features/events/api'
import { addDays, endOfMonth, seoulDateString, seoulWeekday } from '@/features/events/lib/seoulDate'
import { formatDate } from '@/shared/lib/formatDate'
import type { EventArea, EventCategory } from '@/shared/types/event'

// S03 search conditions. They live in the URL (?q=&category=&date=&area=&sort=) so the back button
// and a shared link bring the same results back. The position is never put in the URL.

export const CATEGORIES: EventCategory[] = ['festival', 'exhibition', 'performance']
export const AREAS: EventArea[] = [
  'jongno-jung',
  'mapo-seodaemun',
  'yongsan-yeouido',
  'gangnam-songpa',
]
export const DATE_PRESETS = ['today', 'weekend', 'month'] as const
export const KEYWORD_MAX = 50

export type DatePreset = (typeof DATE_PRESETS)[number]
/** A preset or one picked day (YYYY-MM-DD). */
export type DateChoice = DatePreset | `${number}-${number}-${number}`
export type SortOrder = 'date' | 'distance'

export interface SearchFilters {
  category?: EventCategory
  date?: DateChoice
  area?: EventArea
}

export interface SearchConditions extends SearchFilters {
  keyword: string
  sort: SortOrder
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDay(value: string) {
  if (!DAY_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function parseDate(value: string | null): DateChoice | undefined {
  if (!value) return undefined
  if ((DATE_PRESETS as readonly string[]).includes(value)) return value as DatePreset
  // Past days would only list ended events.
  return isValidDay(value) && value >= seoulDateString() ? (value as DateChoice) : undefined
}

/** Reads the URL. Unknown values are ignored rather than sent to the API. */
export function readConditions(params: URLSearchParams): SearchConditions {
  const category = params.get('category')
  const area = params.get('area')
  return {
    keyword: (params.get('q') ?? '').trim().slice(0, KEYWORD_MAX),
    category: CATEGORIES.find((c) => c === category),
    date: parseDate(params.get('date')),
    area: AREAS.find((a) => a === area),
    sort: params.get('sort') === 'distance' ? 'distance' : 'date',
  }
}

export function writeConditions(conditions: SearchConditions) {
  const params = new URLSearchParams()
  if (conditions.keyword) params.set('q', conditions.keyword)
  if (conditions.category) params.set('category', conditions.category)
  if (conditions.date) params.set('date', conditions.date)
  if (conditions.area) params.set('area', conditions.area)
  if (conditions.sort === 'distance') params.set('sort', 'distance')
  return params
}

/** 「11/30(月)」 for a picked day. */
export function pickedDayLabel(day: string) {
  return formatDate(`${day}T12:00:00+09:00`)
}

export function countFilters(filters: SearchFilters) {
  return [filters.category, filters.date, filters.area].filter(Boolean).length
}

/**
 * Date button → dateFrom/dateTo (issue #13). No date: from today on, ended events left out.
 * 今週末 is Saturday–Sunday; on a Saturday or Sunday it starts today.
 */
export function dateRange(choice: DateChoice | undefined, now = new Date()) {
  const today = seoulDateString(now)
  switch (choice) {
    case undefined:
      return { dateFrom: today }
    case 'today':
      return { dateFrom: today, dateTo: today }
    case 'weekend': {
      const weekday = seoulWeekday(now)
      if (weekday === 0) return { dateFrom: today, dateTo: today }
      const saturday = addDays(today, 6 - weekday)
      return { dateFrom: weekday === 6 ? today : saturday, dateTo: addDays(saturday, 1) }
    }
    case 'month':
      return { dateFrom: today, dateTo: endOfMonth(today) }
    default:
      return { dateFrom: choice, dateTo: choice }
  }
}

/** Conditions + position → API query values. Without a position the list falls back to date order. */
export function toListParams(
  conditions: SearchConditions,
  position: { lat: number; lng: number } | null,
  now = new Date(),
): Omit<EventListParams, 'page' | 'size'> {
  const byDistance = conditions.sort === 'distance' && position !== null
  return {
    keyword: conditions.keyword || undefined,
    category: conditions.category,
    ...dateRange(conditions.date, now),
    area: conditions.area,
    sort: byDistance ? 'distance' : 'date',
    lat: byDistance ? position.lat : undefined,
    lng: byDistance ? position.lng : undefined,
  }
}
