import { eventStatus, type EventStatus } from '@/features/events/lib/eventText'
import type { EventSummary } from '@/shared/types/event'

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
})

function monthDay(iso: string) {
  const parts = dayFormatter.formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { month: get('month'), day: get('day') }
}

/** Printed like a ticket: 「11.01 – 11.30」, one day as 「11.29」. */
export function ticketPeriod(startIso: string, endIso: string) {
  const s = monthDay(startIso)
  const e = monthDay(endIso)
  const start = `${s.month}.${s.day}`
  const end = `${e.month}.${e.day}`
  return start === end ? start : `${start} – ${end}`
}

/** Ticket number from the start day and the id: 「1101-0001」 (decoration only). */
export function ticketNumber(event: Pick<EventSummary, 'id' | 'startDate'>) {
  const { month, day } = monthDay(event.startDate)
  return `${month}${day}-${String(event.id).padStart(4, '0')}`
}

const STATUS_ORDER: Record<EventStatus, number> = { ongoing: 0, upcoming: 1, ended: 2 }

/** Happening now first, then the soonest upcoming, ended last. */
export function sortForMap<T extends EventSummary>(events: T[], now = new Date()) {
  return [...events].sort((a, b) => {
    const byStatus =
      STATUS_ORDER[eventStatus(a.startDate, a.endDate, now)] -
      STATUS_ORDER[eventStatus(b.startDate, b.endDate, now)]
    return byStatus || a.startDate.localeCompare(b.startDate) || a.id - b.id
  })
}
