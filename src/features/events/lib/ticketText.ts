import { seoulMonthDay } from '@/features/events/lib/seoulDate'
import type { EventSummary } from '@/shared/types/event'

/** Printed ticket number: start month-day + id, e.g. 「1101-0001」. Decoration only. */
export function ticketNumber(event: Pick<EventSummary, 'id' | 'startDate'>) {
  const monthDay = seoulMonthDay(new Date(event.startDate)).replace('.', '')
  return `${monthDay}-${String(event.id).padStart(4, '0')}`
}

/**
 * DATE field: 「11.29」 for one day, 「〜 12.15」 when it has already started,
 * otherwise 「11.29 — 12.15」.
 */
export function ticketDate(startIso: string, endIso: string, now = new Date()) {
  const start = new Date(startIso)
  const startText = seoulMonthDay(start)
  const endText = seoulMonthDay(new Date(endIso))
  if (startText === endText) return startText
  if (now >= start) return `〜 ${endText}`
  return `${startText} — ${endText}`
}
