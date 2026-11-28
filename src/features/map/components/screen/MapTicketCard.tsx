import { Link } from 'react-router'
import { eventStatus } from '@/features/events/lib/eventText'
import routeIcon from '@/features/map/assets/route.svg'
import { DirectionsLink } from '@/features/map/components/DirectionsLink'
import { ticketNumber, ticketPeriod } from '@/features/map/lib/ticketText'
import { ja } from '@/shared/i18n/ja'
import { categoryLabel, preferJa } from '@/shared/lib/eventText'
import type { EventCategory, EventSummary } from '@/shared/types/event'

// Ticket paper and print color per category (Figma Concept 切符 / kippu).
const PAPER: Record<EventCategory, string> = {
  festival: 'bg-festival-soft',
  exhibition: 'bg-exhibit-soft',
  performance: 'bg-stage-soft',
}
const PRINT: Record<EventCategory, string> = {
  festival: 'text-festival',
  exhibition: 'text-exhibit',
  performance: 'text-stage',
}
const BAR: Record<EventCategory, string> = {
  festival: 'bg-festival',
  exhibition: 'bg-exhibit',
  performance: 'bg-stage',
}
const STAMP: Record<EventCategory, string> = {
  festival: 'border-festival text-festival',
  exhibition: 'border-exhibit text-exhibit',
  performance: 'border-stage text-stage',
}

export interface MapTicketCardProps {
  event: EventSummary & { lat: number; lng: number }
  selected: boolean
}

/**
 * One event as a ticket in the bottom carousel. The main part opens the detail (S05);
 * the stub past the perforation opens Google Maps directions.
 */
export function MapTicketCard({ event, selected }: MapTicketCardProps) {
  const t = ja.map
  const title = preferJa(event.titleJa, event.title)
  const status = eventStatus(event.startDate, event.endDate)

  return (
    <article
      className={`relative flex h-[128px] overflow-hidden rounded-[10px] ${PAPER[event.category]} shadow-[0_8px_24px_rgb(30_34_48/0.18)] transition-transform duration-300 ease-out ${
        selected ? 'scale-100' : 'scale-[0.94]'
      }`}
    >
      <Link
        to={`/events/${event.id}`}
        className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-2 pl-3.5"
      >
        <div className="flex items-center gap-1.5">
          <span aria-hidden className={`h-3.5 w-[3px] rounded-full ${BAR[event.category]}`} />
          <span className={`font-mincho text-xs font-bold ${PRINT[event.category]}`}>
            {categoryLabel(event.category)}
          </span>
          <span
            aria-hidden
            className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${PRINT[event.category]}`}
          >
            {t.categoryCode[event.category]}
          </span>
          {status !== 'upcoming' && (
            <span
              className={`rounded-sm px-1 text-[10px] leading-[1.6] font-bold ${
                status === 'ongoing' ? 'bg-warn-soft text-warn' : 'bg-line text-ink-muted'
              }`}
            >
              {ja.eventDetail.status[status]}
            </span>
          )}
          <span
            aria-hidden
            className="ml-auto font-mono text-[9px] tracking-[0.08em] text-ink-muted"
          >
            {t.ticketNo}
            {ticketNumber(event)}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-mincho text-[17px] leading-[1.35] font-bold text-ink">
            {title}
          </h2>
          <p className="truncate text-[10px] leading-[1.5] text-ink-muted">
            {event.titleJa === null ? ja.eventDetail.noTranslation : `${t.original} ${event.title}`}
          </p>
        </div>

        <dl className="flex gap-4">
          <div className="shrink-0">
            <dt className="font-mono text-[8px] tracking-[0.14em] text-ink-muted">{t.dateCode}</dt>
            <dd className="font-mono text-xs font-semibold whitespace-nowrap text-ink">
              {ticketPeriod(event.startDate, event.endDate)}
            </dd>
          </div>
          <div className={`min-w-0 ${event.isFree ? 'pr-11' : ''}`}>
            <dt className="font-mono text-[8px] tracking-[0.14em] text-ink-muted">{t.venueCode}</dt>
            <dd className="truncate text-xs font-bold text-ink">
              {preferJa(event.venueNameJa, event.venueName)}
            </dd>
          </div>
        </dl>
      </Link>

      {event.isFree && (
        // Fare stamp (Figma kippu/FareStamp): free events are stamped 無料 like a paid fare.
        <span
          className={`pointer-events-none absolute right-[78px] bottom-2.5 flex size-11 -rotate-12 flex-col items-center justify-center rounded-full border-[1.5px] leading-none opacity-85 ${STAMP[event.category]}`}
        >
          <span className="font-mincho text-[11px] font-bold">{ja.eventDetail.free}</span>
          <span aria-hidden className="mt-0.5 font-mono text-[6px] tracking-[0.14em]">
            {t.freeCode}
          </span>
        </span>
      )}

      {/* Perforation: dashed line with half-circle notches cut into the paper. */}
      <div aria-hidden className="relative w-0 border-l border-dashed border-ink/25">
        <span className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-app" />
        <span className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-app" />
      </div>

      <DirectionsLink
        lat={event.lat}
        lng={event.lng}
        className="flex w-[68px] shrink-0 flex-col items-center justify-center gap-1 text-ink"
      >
        <span aria-hidden className="font-mono text-[8px] tracking-[0.14em] text-ink-muted">
          {t.routeCode}
        </span>
        <img src={routeIcon} alt="" width={22} height={22} />
        <span className="text-[11px] font-bold">{t.route}</span>
        <span className="sr-only">{t.directions}</span>
      </DirectionsLink>
    </article>
  )
}
