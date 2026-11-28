import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { TicketTitle } from '@/features/events/components/ticket/TicketTitle'
import { PaperGrain, Perforation, PunchHole } from '@/features/events/components/ticket/ticketParts'
import { preferJa } from '@/features/events/lib/eventText'
import { homeCategoryLabel, ticketCategory } from '@/features/events/lib/popup'
import { ticketDate, ticketNumber } from '@/features/events/lib/ticketText'
import { TICKET_COLORS } from '@/features/events/lib/ticketStyle'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/event'

// The title animation starts when 60% of the card is on screen (Figma motion memo k1).
function useSeenOnce<T extends Element>(threshold: number) {
  const ref = useRef<T>(null)
  // Without IntersectionObserver (very old browsers) treat the card as seen right away.
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || seen) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSeen(true)
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [seen, threshold])

  return [ref, seen] as const
}

function Field({ label, value, spoken, muted = false, grow = false }: FieldProps) {
  return (
    <div className={`flex flex-col gap-px leading-[1.4] ${grow ? 'min-w-0 flex-1' : 'shrink-0'}`}>
      <dt aria-hidden="true" className="font-mono text-[8px] tracking-[0.14em] text-ink-muted">
        {label}
      </dt>
      <dd className={`truncate text-xs font-medium ${muted ? 'text-ink-faint' : 'text-ink'}`}>
        {spoken ? (
          <>
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">{spoken}</span>
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  /** Read out instead of `value` (the printed 「¥0」 is read as 「無料」). */
  spoken?: string
  muted?: boolean
  grow?: boolean
}

export interface EventTicketProps {
  event: EventSummary
}

// Home card printed as a train ticket (Figma: Concept 切符 / S02-k4 読める切符).
export function EventTicket({ event }: EventTicketProps) {
  const t = ja.ticket
  const kind = ticketCategory(event)
  const color = TICKET_COLORS[kind]
  const [ref, seen] = useSeenOnce<HTMLAnchorElement>(0.6)
  const venue = preferJa(event.venueNameJa, event.venueName)

  return (
    <Link
      ref={ref}
      to={`/events/${event.id}`}
      className={`relative flex min-h-[196px] overflow-hidden rounded-[10px] shadow-[0_2px_10px_rgba(26,29,38,0.08)] outline-offset-2 transition-transform duration-150 ease-out active:scale-[0.99] ${color.paper}`}
    >
      <PaperGrain />
      <article className="relative flex min-w-0 flex-1 flex-col gap-2 py-3.5 pr-3 pl-4">
        <div className="flex items-center gap-2">
          <p
            className={`flex shrink-0 items-center gap-1.5 rounded-[2px] py-1 pr-2.5 pl-1.5 leading-[1.4] whitespace-nowrap ${color.text}`}
          >
            <span aria-hidden="true" className={`h-4 w-1 ${color.bar}`} />
            <span className="text-xs font-bold">{homeCategoryLabel(kind)}</span>
            <span aria-hidden="true" className="font-mono text-[9px] tracking-[0.14em]">
              {t.categoryCode[kind]}
            </span>
          </p>
          <span
            aria-hidden="true"
            className="ml-auto truncate font-mono text-[9px]/[1.4] tracking-[0.1em] text-ink-muted"
          >
            No.{ticketNumber(event)}
          </span>
        </div>

        <TicketTitle
          eventId={event.id}
          title={event.title}
          titleJa={event.titleJa}
          visible={seen}
        />

        <dl className="mt-auto flex items-start gap-[18px] pr-1">
          <Field label={t.date} value={ticketDate(event.startDate, event.endDate)} />
          <Field label={t.venue} value={venue} grow />
          <Field
            label={t.fare}
            value={event.isFree ? t.fareFree : t.farePaid}
            spoken={event.isFree ? t.freeStamp : undefined}
            muted={event.isFree}
          />
        </dl>
      </article>

      <Perforation />

      <div className="relative flex w-16 shrink-0 flex-col items-center gap-1.5 pt-4 pr-2 pb-3.5 pl-1">
        <span
          aria-hidden="true"
          className="font-mono text-[8px]/[1.4] tracking-[0.14em] text-ink-muted"
        >
          {t.admit}
        </span>
        <span
          aria-hidden="true"
          className={`font-mono text-sm/[1.4] font-semibold tracking-[0.06em] ${color.text}`}
        >
          {t.one}
        </span>
        {event.companionCount > 0 && (
          <span
            className={
              'mt-1 rounded-full bg-gate-soft px-1.5 text-[10px]/[1.6] font-bold text-gate-ink'
            }
          >
            <span aria-hidden="true">{t.companions(event.companionCount)}</span>
            <span className="sr-only">{t.companionsLabel(event.companionCount)}</span>
          </span>
        )}
        <span className="flex-1" />
        <PunchHole />
      </div>

      {event.isFree && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-16 bottom-6 flex size-16 -rotate-[8deg] flex-col items-center justify-center rounded-full border-2 opacity-90 ${color.border} ${color.text}`}
        >
          <span className="absolute inset-[3px] rounded-full border border-current opacity-60" />
          <span className="font-mincho text-[17px]/[1.1] font-extrabold">{t.freeStamp}</span>
          <span className="font-mono text-[7px]/[1.4] tracking-[0.2em]">{t.freeStampCode}</span>
        </span>
      )}
    </Link>
  )
}

/** Ticket-shaped placeholder while the list loads. */
export function EventTicketSkeleton() {
  return (
    <div className="relative flex h-[196px] animate-pulse overflow-hidden rounded-[10px] bg-paper">
      <div className="flex flex-1 flex-col gap-3 py-3.5 pr-3 pl-4">
        <div className="h-6 w-24 rounded-sm bg-line/60" />
        <div className="h-8 w-4/5 rounded bg-line/60" />
        <div className="h-3 w-1/2 rounded bg-line/40" />
        <div className="mt-auto h-7 w-full rounded bg-line/40" />
      </div>
      <Perforation />
      <div className="w-16 shrink-0" />
    </div>
  )
}
