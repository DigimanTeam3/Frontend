import { useState, type ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'
import { seoulDateParts } from '@/shared/lib/seoulDate'
import type { JourneyEvent, JourneyEventCategory } from '@/shared/types/eventBrief'
import lanternPhoto from '@/shared/ui/assets/ticket-lantern.svg'

/** plain: as printed. glowing: pink ring, ready to tear. dimmed: faded, the check-in failed. */
export type GateTicketLook = 'plain' | 'glowing' | 'dimmed'

export interface GateTicketProps {
  event: Pick<
    JourneyEvent,
    'title' | 'titleJa' | 'venueName' | 'venueNameJa' | 'imageUrl' | 'category' | 'source'
  >
  /** Participation id, printed as "No.1129-0042" and on the stub. null: no number yet. */
  ticketNumber: number | null
  /** Day of the visit; printed in Seoul time. */
  visitDate: Date | string
  /** attached: with the tear-off stub, perforation and notches. none: the stub is torn off. */
  stub: 'attached' | 'none'
  look?: GateTicketLook
  /** With stub 'none': the dark punch hole where the stub was torn off (S10). */
  punched?: boolean
  /**
   * Wraps the stub paper, so the screen that tears it can move it and listen to the drag:
   * `renderStub={(stub) => <div style={{ transform }}>{stub}</div>}`.
   */
  renderStub?: (stub: ReactNode) => ReactNode
  /** Extra classes on the outer box (it is 300px wide and shrinks on narrow screens). */
  className?: string
}

const LABEL = 'font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] text-ink-faint'
const VALUE = 'text-[15px] leading-[1.65] font-bold break-words text-ink'

// Looked up by the name the server sends, so a category added later still gets a tag.
const OTHER_TAG_COLOR = 'bg-ink/5 text-ink-muted'
const TAG_COLORS: Partial<Record<string, string>> = {
  festival: 'bg-festival-soft text-festival',
  exhibition: 'bg-exhibit-soft text-exhibit',
  performance: 'bg-stage-soft text-stage',
  popup: 'bg-gate-soft text-gate-ink',
} satisfies Record<JourneyEventCategory, string>
const TAG_LABELS: Partial<Record<string, string>> = ja.gateTicket.category

// Paper ticket of an event (Figma: S09 / S10 "ticket"). Shared because the check-in (S09) shows
// it with its stub and the participation badge screen (S10) shows it after the stub is torn off.
export function GateTicket({
  event,
  ticketNumber,
  visitDate,
  stub,
  look = 'plain',
  punched = false,
  renderStub,
  className,
}: GateTicketProps) {
  // A photo URL that does not load falls back to the lantern picture too.
  const [photoFailed, setPhotoFailed] = useState(false)
  // Until the contract has a pop-up category, pop-up stores arrive as "exhibition" and are told
  // apart by their source (backend note of 11/28).
  const tag = event.source === 'popup_map_kr' ? 'popup' : event.category
  const photo = event.imageUrl && !photoFailed ? event.imageUrl : lanternPhoto

  const { month, day, weekday } = seoulDateParts(visitDate)
  const serial = ticketNumber === null ? null : String(ticketNumber).padStart(4, '0')
  const dimmed = look === 'dimmed'

  const stubPaper = (
    <div className="flex flex-col items-center gap-0.5 rounded-b-[16px] bg-paper px-5 py-[18px]">
      <p className={`${LABEL} text-center whitespace-pre-wrap`}>{ja.gateTicket.stubCaption}</p>
      {serial && (
        // The negative margin takes back the spacing after the last digit, so the number is centered.
        <p className="mr-[-0.2em] font-mono text-[28px] leading-[1.2] font-semibold tracking-[0.2em] text-festival">
          {serial}
        </p>
      )}
    </div>
  )

  return (
    <div
      className={`relative w-[300px] max-w-full ${dimmed ? 'opacity-55' : ''} ${className ?? ''}`}
    >
      {look === 'glowing' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[3px] rounded-[18px] border-[3px] border-gate shadow-[0_0_28px_2px] shadow-gate/50"
        />
      )}

      <div className="relative overflow-hidden rounded-t-[16px] bg-paper">
        <img
          src={photo}
          alt=""
          draggable={false}
          onError={() => setPhotoFailed(true)}
          className="h-32 w-full object-cover"
        />
        <div className="flex flex-col gap-2.5 px-5 pt-4 pb-[18px]">
          <div className="flex items-start gap-1.5">
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-[3px] text-xs leading-normal font-bold ${TAG_COLORS[tag] ?? OTHER_TAG_COLOR}`}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {TAG_LABELS[tag] ?? ja.gateTicket.otherCategory}
            </span>
            {serial && (
              <span className={`${LABEL} ml-auto text-right`}>
                {ja.gateTicket.number(`${month}${day}`, serial)}
              </span>
            )}
          </div>
          <p
            lang={event.titleJa === null ? 'ko' : undefined}
            className="font-mincho text-[22px] leading-[1.3] font-extrabold tracking-[0.01em] break-words text-ink"
          >
            {event.titleJa ?? event.title}
          </p>
          {/* TODO(api): the Figma ticket has a third column "WITH" (companion name). The
              participation contract has no companion yet, so it is left out. */}
          <dl className="flex items-start gap-[18px]">
            <div className="min-w-0">
              <dt className={LABEL}>{ja.gateTicket.venueLabel}</dt>
              <dd lang={event.venueNameJa === null ? 'ko' : undefined} className={VALUE}>
                {event.venueNameJa ?? event.venueName}
              </dd>
            </div>
            <div className="shrink-0">
              <dt className={LABEL}>{ja.gateTicket.dateLabel}</dt>
              <dd className={`${VALUE} whitespace-nowrap`}>
                {ja.gateTicket.date(month, day, weekday)}
              </dd>
            </div>
          </dl>
        </div>
        {punched && stub === 'none' && (
          <span
            aria-hidden="true"
            className="absolute right-3.5 bottom-[57px] size-[30px] rounded-full border border-dashed border-ink-faint bg-ink shadow-[inset_0_2px_3px] shadow-black/35"
          />
        )}
      </div>

      {stub === 'attached' && (
        <>
          {/* Zero-height line between the two halves: perforation and the punched notches stay
              with the main half when the stub is pulled away, and sit above the stub. */}
          <div aria-hidden="true" className="relative z-10">
            <svg
              className={`absolute bottom-0 left-3 w-[calc(100%-24px)] ${
                dimmed ? 'h-[1.5px] text-ink-faint' : 'h-0.5 text-gate'
              }`}
            >
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="currentColor"
                strokeWidth={dimmed ? 1.5 : 2}
                strokeDasharray="4.95 3.95"
              />
            </svg>
            {/* Painted with the page background to look like bites out of the paper. */}
            <span className="absolute -top-[9px] -left-[9px] size-[18px] rounded-full bg-app" />
            <span className="absolute -top-[9px] -right-[9px] size-[18px] rounded-full bg-app" />
          </div>
          {renderStub ? renderStub(stubPaper) : stubPaper}
        </>
      )}
    </div>
  )
}
