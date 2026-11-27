import { Link } from 'react-router'
import { serial, ticketPeriod } from '@/features/concierge/lib/format'
import { ja } from '@/shared/i18n/ja'
import type { ConciergeEventCategory, ConciergeRecommendation } from '@/shared/types/concierge'

const t = ja.concierge.ticket

// Ticket paper and print colors per category (Figma kippu/festival, kippu/exhibit, kippu/stage).
const CATEGORY_STYLE: Record<
  ConciergeEventCategory,
  { paper: string; ink: string; border: string }
> = {
  festival: { paper: 'bg-[#f7dccb]', ink: 'text-[#c4532f]', border: 'border-[#c4532f]' },
  exhibition: { paper: 'bg-[#d8e6f0]', ink: 'text-[#2f5f86]', border: 'border-[#2f5f86]' },
  performance: { paper: 'bg-[#dfe9cf]', ink: 'text-[#5a7a36]', border: 'border-[#5a7a36]' },
}

export interface EventTicketProps {
  recommendation: ConciergeRecommendation
  /** ms before the Korean title turns into Japanese (after the ticket is printed). */
  revealDelay: number
}

/** One recommended event, printed as a 切符 (Figma: Concept 切符 / ticket). */
export function EventTicket({ recommendation, revealDelay }: EventTicketProps) {
  const { event, reason } = recommendation
  const style = CATEGORY_STYLE[event.category]
  const category = t.category[event.category]
  const venue = event.venueNameJa ?? event.venueName

  return (
    <article
      aria-label={event.titleJa ?? event.title}
      className={`relative overflow-hidden rounded-xl ${style.paper} text-ink shadow-[0_1px_0_rgba(30,34,48,0.08),0_6px_16px_-10px_rgba(30,34,48,0.45)]`}
    >
      <div className="flex">
        <div className="relative min-w-0 flex-1 px-4 pt-3.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className={`flex items-center gap-1.5 ${style.ink}`}>
              <span aria-hidden="true" className={`h-3.5 w-[3px] rounded-full bg-current`} />
              <span className="text-xs font-bold">{category.ja}</span>
              <span className="font-mono text-[9px] font-semibold tracking-[0.16em]">
                {category.code}
              </span>
            </p>
            <p className="font-mono text-[10px] tracking-[0.08em] text-ink-muted">
              {serial(event.id)}
            </p>
          </div>

          <h3 className="mt-2 font-mincho text-[20px] leading-[1.3] font-extrabold">
            <Link to={`/events/${event.id}`} className="grid">
              {event.titleJa ? (
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
              ) : (
                <span lang="ko">{event.title}</span>
              )}
            </Link>
          </h3>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {event.titleJa ? (
              <>
                {t.original} <span lang="ko">{event.title}</span>
              </>
            ) : (
              t.noTranslation
            )}
          </p>

          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pr-16">
            <dt className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">{t.date}</dt>
            <dt className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">{t.venue}</dt>
            <dd className="font-mono text-[13px] font-semibold whitespace-nowrap">
              {ticketPeriod(event.startDate, event.endDate)}
            </dd>
            <dd
              className="line-clamp-2 text-[13px] leading-[1.4] font-bold"
              lang={event.venueNameJa ? 'ja' : 'ko'}
            >
              {venue}
            </dd>
          </dl>

          {/* Fare stamp */}
          <div
            className={`absolute right-3 bottom-3 flex size-[58px] -rotate-12 flex-col items-center justify-center rounded-full border-2 ${style.border} ${style.ink} opacity-90`}
          >
            <span className="font-mincho text-[15px] leading-none font-extrabold">
              {event.isFree ? t.free : t.paid}
            </span>
            {event.isFree && (
              <span className="mt-0.5 font-mono text-[7px] tracking-[0.2em]">{t.freeCode}</span>
            )}
          </div>
        </div>

        {/* Stub, past the perforation */}
        <div
          aria-hidden="true"
          className="flex w-14 shrink-0 flex-col items-center justify-between border-l-2 border-dashed border-ink/20 py-3.5"
        >
          <span className="font-mono text-[8px] tracking-[0.18em] text-ink-muted">{t.admit}</span>
          <span className={`font-mono text-sm font-semibold ${style.ink}`}>{t.admitCount}</span>
          <span className="size-7 rounded-full border border-dashed border-ink/40" />
        </div>
      </div>

      <div className="border-t border-dashed border-ink/20 px-4 py-3">
        <p className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">{t.reason}</p>
        <p className="mt-0.5 text-[13px] leading-[1.6]">{reason}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex min-h-10 items-center rounded-full bg-ink px-4 text-[13px] font-bold text-surface transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            {t.detail}
          </Link>
          <Link
            to={`/map?event=${event.id}`}
            className="flex min-h-10 items-center rounded-full border border-ink/30 px-4 text-[13px] font-bold transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            {t.map}
          </Link>
          {event.companionCount > 0 && (
            <Link
              to={`/events/${event.id}/companions`}
              className="flex min-h-10 items-center rounded-full border border-ink/30 px-4 text-[13px] font-bold transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {t.companions(event.companionCount)}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
