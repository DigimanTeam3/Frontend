import { conditionLabels } from '@/features/concierge/lib/format'
import { ja } from '@/shared/i18n/ja'
import type { ConciergeConditions } from '@/shared/types/concierge'
import type { TicketArea, TicketCategory, TicketCreateRequest } from '@/shared/types/ticket'

// Limits of POST /saved-conditions.
const MAX_LABEL = 120
const MAX_KEYWORDS = 10
const MAX_KEYWORD = 50
const DAY = /^\d{4}-\d{2}-\d{2}$/

const day = (value: string | null) => (value && DAY.test(value) ? value : null)

function known<T extends string>(value: unknown, names: Record<string, string>): T | null {
  return typeof value === 'string' && Object.hasOwn(names, value) ? (value as T) : null
}

/**
 * The reply's conditions as the body of POST /saved-conditions. Values the server would refuse
 * are left out, so one odd value does not lose the whole ticket. `fallbackLabel` is used when
 * there is no condition to name.
 */
export function toTicketCreateRequest(
  conditions: ConciergeConditions,
  fallbackLabel: string,
): TicketCreateRequest {
  let dateFrom = day(conditions.dateFrom)
  let dateTo = day(conditions.dateTo)
  if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom]
  const keywords = [
    ...new Set(
      conditions.keywords.map((keyword) => keyword.trim().slice(0, MAX_KEYWORD)).filter(Boolean),
    ),
  ].slice(0, MAX_KEYWORDS)
  const label = conditionLabels(conditions).join('・') || fallbackLabel
  return {
    labelJa: label.slice(0, MAX_LABEL),
    dateFrom,
    dateTo,
    area: known<TicketArea>(conditions.area, ja.search.areas),
    category: known<TicketCategory>(conditions.category, ja.eventCategory),
    // The concierge says 'group' where the saved condition says 'together'.
    companion:
      conditions.companion === 'alone'
        ? 'alone'
        : conditions.companion === 'group'
          ? 'together'
          : null,
    keywords,
    notifyLine: true,
  }
}

// A logged-out visitor goes to the login screen first. The conditions wait here (this tab only)
// and the voice counter offers the 予約券 again when they come back.
const PENDING_KEY = 'digiman.concierge.pendingReservation'

export function keepPendingReservation(conditions: ConciergeConditions) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(conditions))
  } catch {
    // Storage blocked (private mode): the offer is simply not shown again.
  }
}

function isConditions(value: unknown): value is ConciergeConditions {
  const item = value as Partial<ConciergeConditions> | null
  return (
    typeof item === 'object' &&
    item !== null &&
    Array.isArray(item.keywords) &&
    item.keywords.every((keyword) => typeof keyword === 'string')
  )
}

export function clearPendingReservation() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** The waiting conditions, if any (read only: clear them with clearPendingReservation). */
export function peekPendingReservation(): ConciergeConditions | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    if (!isConditions(value)) return null
    const text = (v: unknown) => (typeof v === 'string' ? v : null)
    return {
      dateFrom: text(value.dateFrom),
      dateTo: text(value.dateTo),
      area: text(value.area),
      // Unknown categories are left out of the labels by conditionLabels.
      category: text(value.category) as ConciergeConditions['category'],
      companion:
        value.companion === 'alone' || value.companion === 'group' ? value.companion : null,
      keywords: value.keywords,
    }
  } catch {
    return null
  }
}
