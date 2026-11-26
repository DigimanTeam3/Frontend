import type { Event } from '@/shared/types/event'
import { formatDateRange } from '@/shared/lib/formatDate'

export interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-2xl border border-line p-4">
      <h2 className="font-bold">{event.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{event.venue_name}</p>
      <p className="mt-1 text-sm text-ink-muted">
        {formatDateRange(event.start_date, event.end_date)}
      </p>
    </article>
  )
}
