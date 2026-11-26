import type { EventSummary } from '@/shared/types/event'
import { formatDateRange } from '@/shared/lib/formatDate'

export interface EventCardProps {
  event: EventSummary
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-2xl border border-line p-4">
      <h2 className="font-bold">{event.titleJa ?? event.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{event.venueNameJa ?? event.venueName}</p>
      <p className="mt-1 text-sm text-ink-muted">
        {formatDateRange(event.startDate, event.endDate)}
      </p>
    </article>
  )
}
