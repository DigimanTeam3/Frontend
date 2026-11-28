import { ja } from '@/shared/i18n/ja'
import { formatDayRange } from '@/shared/i18n/format'
import type { TicketArea, TicketCategory, TicketCreateRequest } from '@/shared/types/ticket'

// The AI concierge (S16) hands the search conditions of 「この条件で予約券をつくる」 to this screen in
// two ways (src/features/concierge/lib/reservationDraft.ts): the router state
// `conciergeConditions`, and the sessionStorage key below, which is still there after the trip
// through /login. Features do not import each other, so the key is written here again.
const STORAGE_KEY = 'digiman.concierge.reservationConditions'

// Limits of POST /saved-conditions.
const LABEL_MAX = 120
const KEYWORD_MAX = 50
const KEYWORDS_MAX = 10

/**
 * The conditions waiting for this screen, as they were handed over (not checked yet). Only reads:
 * `clearTicketDraft` takes the stored copy away.
 */
export function readTicketDraft(routerState: unknown): unknown {
  const fromState = isRecord(routerState) ? routerState.conciergeConditions : null
  if (fromState) return fromState
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    // Storage blocked, or the stored text is broken: the router state was all there is.
    return null
  }
}

/**
 * Takes the stored copy away. Called on every visit, also when the router state had the
 * conditions, so old conditions are not used again on a later visit.
 */
export function clearTicketDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: nothing was stored.
  }
}

/**
 * The request for POST /saved-conditions, or null when nothing usable was handed over. Values the
 * server would refuse are left out, so one odd value does not lose the whole ticket.
 */
export function toTicketRequest(conditions: unknown): TicketCreateRequest | null {
  if (!isRecord(conditions)) return null

  let dateFrom = toDay(conditions.dateFrom)
  let dateTo = toDay(conditions.dateTo)
  if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom]

  const area = toKnown<TicketArea>(conditions.area, ja.search.areas)
  const category = toKnown<TicketCategory>(conditions.category, ja.eventCategory)
  // The concierge says 'group' where the saved condition says 'together'.
  const companion =
    conditions.companion === 'alone'
      ? 'alone'
      : conditions.companion === 'group' || conditions.companion === 'together'
        ? 'together'
        : null
  const keywords = toKeywords(conditions.keywords)

  const { reservationTicket: copy } = ja
  const parts = [
    dateFrom || dateTo ? formatDayRange(dateFrom ?? dateTo ?? '', dateTo ?? dateFrom ?? '') : '',
    area ? ja.search.areas[area] : '',
    category ? ja.eventCategory[category] : '',
    companion ? copy.companion[companion] : '',
    ...keywords,
  ].filter(Boolean)

  return {
    labelJa: toLabel(parts) || copy.anyCondition,
    dateFrom,
    dateTo,
    area,
    category,
    companion,
    keywords,
    notifyLine: true,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** YYYY-MM-DD of a real calendar day, else null. */
function toDay(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null
}

/** The value when it is one of the keys of `table` (the values the server knows), else null. */
function toKnown<T extends string>(value: unknown, table: Record<T, string>) {
  return typeof value === 'string' && Object.hasOwn(table, value) ? (value as T) : null
}

function toKeywords(value: unknown) {
  if (!Array.isArray(value)) return []
  const keywords = value
    .filter((keyword): keyword is string => typeof keyword === 'string')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0 && keyword.length <= KEYWORD_MAX)
  return [...new Set(keywords)].slice(0, KEYWORDS_MAX)
}

/** The parts in one line, e.g. 「11月28日（土）、展示、一人で」. Parts that no longer fit are left out. */
function toLabel(parts: string[]) {
  let label = ''
  for (const part of parts) {
    const next = label ? `${label}${ja.reservationTicket.conditionSeparator}${part}` : part
    if (next.length > LABEL_MAX) break
    label = next
  }
  return label
}
