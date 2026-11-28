import { Link } from 'react-router'
import { preferJa } from '@/shared/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import { formatDateRange } from '@/shared/lib/formatDate'
import type { EventSummary } from '@/shared/types/event'

export interface MapListCardProps {
  event: EventSummary
}

/** One event in the no-WebGL list: title, venue and dates, opening the detail (S05). */
export function MapListCard({ event }: MapListCardProps) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="block rounded-[10px] border border-line bg-surface p-4 text-ink"
    >
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
