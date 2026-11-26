import { Link } from 'react-router'
import { preferJa } from '@/features/events/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import { formatDateRange } from '@/shared/lib/formatDate'
import type { EventSummary } from '@/shared/types/event'

export interface EventCardProps {
  event: EventSummary
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link to={`/events/${event.id}`} className="block rounded-2xl border border-line p-4">
      <article>
        <h2 className="font-bold">{preferJa(event.titleJa, event.title)}</h2>
        {event.titleJa === null && (
          <p className="mt-0.5 text-xs text-ink-muted">{ja.eventDetail.noTranslation}</p>
        )}
        <p className="mt-1 text-sm text-ink-muted">
          {preferJa(event.venueNameJa, event.venueName)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDateRange(event.startDate, event.endDate)}
        </p>
      </article>
    </Link>
  )
}
