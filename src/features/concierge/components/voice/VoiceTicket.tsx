import { Link } from 'react-router'
import { SparkleIcon } from '@/features/concierge/components/icons'
import { serial, ticketPeriod } from '@/features/concierge/lib/format'
import { ja } from '@/shared/i18n/ja'
import type { ConciergeEventCategory, ConciergeRecommendation } from '@/shared/types/concierge'

const t = ja.concierge.ticket

// Category band and tag colors (Figma ui/festival, ui/exhibit, ui/stage).
const CATEGORY_STYLE: Record<ConciergeEventCategory, { band: string; tag: string }> = {
  festival: { band: 'bg-festival', tag: 'bg-festival-soft text-festival' },
  exhibition: { band: 'bg-exhibit', tag: 'bg-exhibit-soft text-exhibit' },
  performance: { band: 'bg-stage', tag: 'bg-stage-soft text-stage' },
}
const OTHER_STYLE = { band: 'bg-ink-muted', tag: 'bg-app text-ink-muted' }

export interface VoiceTicketProps {
  recommendation: ConciergeRecommendation
  /** ディグ is reading this ticket's reason: pink frame. */
  reading?: boolean
  /** ms before the Korean title turns into Japanese (while printing); null shows Japanese at once. */
  revealDelay?: number | null
  /** Hide the buttons while the ticket is still coming out of the slot. */
  actions?: boolean
}

/** One recommended event (Figma 「ChatTicket」): a paper ticket with the reason and two buttons. */
export function VoiceTicket({
  recommendation,
  reading = false,
  revealDelay = null,
  actions = true,
}: VoiceTicketProps) {
  const { event, reason } = recommendation
  const known = Object.hasOwn(CATEGORY_STYLE, event.category)
  const style = known ? CATEGORY_STYLE[event.category] : OTHER_STYLE
  const category = known ? t.category[event.category].ja : t.otherCategory.ja
  const venue = event.venueNameJa ?? event.venueName

  return (
    <article
      aria-label={event.titleJa ?? event.title}
      aria-current={reading ? 'true' : undefined}
      className={`flex overflow-hidden rounded-[14px] border-2 bg-[var(--digu-paper)] text-[var(--digu-ink)] shadow-[0_6px_16px_-10px_rgba(26,28,38,0.45)] transition-colors duration-200 ${reading ? 'border-[var(--digu-pink)]' : 'border-transparent'}`}
    >
      <span aria-hidden="true" className={`w-1.5 shrink-0 ${style.band}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3.5 pt-3.5 pb-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-[3px] text-xs leading-[1.5] font-bold ${style.tag}`}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {category}
          </span>
          <span className="ml-auto font-mono text-[11px] tracking-[0.08em] text-[var(--digu-ink-mute)]">
            {serial(event.id)}
          </span>
        </div>

        <div>
          <h3 className="font-mincho text-[19px] leading-[1.3] font-extrabold tracking-[0.01em]">
            <Link to={`/events/${event.id}`} className="grid">
              {event.titleJa && revealDelay !== null ? (
                <>
                  <span
                    aria-hidden="true"
                    lang="ko"
                    className="concierge-scatter [grid-area:1/1]"
                    style={{ animationDelay: `${revealDelay}ms` }}
                  >
                    {event.title}
                  </span>
                  <span
                    className="concierge-settle [grid-area:1/1]"
                    style={{ animationDelay: `${revealDelay + 120}ms` }}
                  >
                    {event.titleJa}
                  </span>
                </>
              ) : event.titleJa ? (
                <span>{event.titleJa}</span>
              ) : (
                <span lang="ko">{event.title}</span>
              )}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs leading-[1.5] text-[var(--digu-ink-mute)]">
            {event.titleJa ? <span lang="ko">{event.title}</span> : t.noTranslation}
          </p>
        </div>

        <p className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-[11px] leading-[1.4] font-medium tracking-[0.06em] text-[var(--digu-ink-sub)]">
          <span className="whitespace-nowrap">{ticketPeriod(event.startDate, event.endDate)}</span>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate font-sans" lang={event.venueNameJa ? 'ja' : 'ko'}>
            {venue}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-sans font-bold">{event.isFree ? t.free : t.paid}</span>
        </p>

        <p className="flex items-start gap-1.5 border-t border-dashed border-[var(--digu-ink)]/25 pt-2 text-xs leading-[1.5] font-bold">
          <span className="mt-px shrink-0 text-[var(--digu-pink)]">
            <SparkleIcon />
          </span>
          <span className="sr-only">{t.reason}</span>
          <span className="min-w-0 break-words">{reason}</span>
        </p>

        {actions && (
          <div className="flex gap-2">
            <Link
              to={`/events/${event.id}`}
              className="flex min-h-10 flex-1 items-center justify-center rounded-[10px] border border-[var(--digu-line)] bg-white px-3 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {t.detail}
            </Link>
            <Link
              to={`/map?event=${event.id}`}
              className="flex min-h-10 flex-1 items-center justify-center rounded-[10px] border border-[var(--digu-line)] bg-white px-3 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {t.map}
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
