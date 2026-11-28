import { Link } from 'react-router'
import { formatDateRange } from '@/shared/lib/formatDate'
import type { EventSummary } from '@/shared/types/companion'

export interface EventStripProps {
  event: EventSummary
  /** Small label above the title, e.g. 「この行事の募集」. */
  label?: string
}

/** Compact event row that links back to the event detail (S05). */
export function EventStrip({ event, label }: EventStripProps) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
    >
      {event.imageUrl ? (
        <img src={event.imageUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
      ) : (
        <span
          aria-hidden
          className="size-11 shrink-0 rounded-lg bg-gradient-to-br from-primary/70 to-ink/60"
        />
      )}
      <span className="min-w-0 flex-1">
        {label && <span className="block text-xs font-bold text-primary">{label}</span>}
        <span className="block truncate font-bold">{event.titleJa ?? event.title}</span>
        <span className="block truncate text-xs text-ink-muted">
          {formatDateRange(event.startDate, event.endDate)} · {event.venueNameJa ?? event.venueName}
        </span>
      </span>
      <span aria-hidden className="text-ink-muted">
        ›
      </span>
    </Link>
  )
}
