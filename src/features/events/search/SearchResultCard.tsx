import { Link } from 'react-router'
import { PaperGrain } from '@/features/events/components/ticket/ticketParts'
import { categoryLabel, preferJa } from '@/features/events/lib/eventText'
import { ticketDate } from '@/features/events/lib/ticketText'
import { TICKET_COLORS } from '@/features/events/lib/ticketStyle'
import { ja } from '@/shared/i18n/ja'
import type { EventListItem } from '@/shared/types/event'

// Search result as a small ticket (S03). Same paper colors as the home ticket, no title animation.
export function SearchResultCard({ event }: { event: EventListItem }) {
  const color = TICKET_COLORS[event.category]
  const hasJa = event.titleJa !== null
  const meta = [
    ticketDate(event.startDate, event.endDate),
    preferJa(event.venueNameJa, event.venueName),
    event.distance != null ? ja.search.distance(event.distance) : null,
  ].filter(Boolean)

  return (
    <Link
      to={`/events/${event.id}`}
      className={`relative flex min-h-[112px] overflow-hidden rounded-[10px] shadow-[0_2px_10px_rgba(30,34,48,0.08)] transition-transform duration-150 ease-out active:scale-[0.99] ${color.paper}`}
    >
      <PaperGrain />
      <article className="relative flex min-w-0 flex-1 flex-col gap-1 py-3 pr-2 pl-3.5">
        <p className={`flex items-center gap-1.5 text-xs/[1.4] font-bold ${color.text}`}>
          <span aria-hidden="true" className={`h-3.5 w-1 ${color.bar}`} />
          {categoryLabel(event.category)}
        </p>
        <h2
          lang={hasJa ? undefined : 'ko'}
          className={`line-clamp-2 text-[17px]/[1.35] ${hasJa ? 'font-mincho font-extrabold [word-break:auto-phrase]' : 'font-serif font-bold break-keep'}`}
        >
          {hasJa ? event.titleJa : event.title}
        </h2>
        {!hasJa && <p className="text-[10px]/[1.4] text-ink-muted">{ja.ticket.noTranslation}</p>}
        <p className="mt-auto truncate text-xs/[1.5] text-ink-muted">{meta.join(' · ')}</p>
      </article>

      <span aria-hidden="true" className="relative w-4 shrink-0 self-stretch">
        <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-app" />
        <span className="absolute inset-y-3 left-1/2 border-l border-dashed border-ink-muted/50" />
        <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-app" />
      </span>

      <div className="relative flex w-16 shrink-0 items-center justify-center pr-2">
        {event.isFree ? (
          <span
            className={`flex size-12 -rotate-[8deg] flex-col items-center justify-center rounded-full border-2 ${color.border} ${color.text}`}
          >
            <span className="font-mincho text-[13px]/[1.1] font-extrabold">
              {ja.ticket.freeStamp}
            </span>
            <span aria-hidden="true" className="font-mono text-[6px]/[1.4] tracking-[0.2em]">
              {ja.ticket.freeStampCode}
            </span>
          </span>
        ) : (
          <span className="text-xs font-bold text-ink-muted">{ja.ticket.farePaid}</span>
        )}
      </div>
    </Link>
  )
}

export function SearchResultSkeleton() {
  return (
    <div className="flex h-[112px] animate-pulse flex-col gap-2 rounded-[10px] bg-surface p-3.5">
      <div className="h-4 w-12 rounded-sm bg-line/60" />
      <div className="h-5 w-3/4 rounded bg-line/60" />
      <div className="mt-auto h-3 w-1/2 rounded bg-line/40" />
    </div>
  )
}
