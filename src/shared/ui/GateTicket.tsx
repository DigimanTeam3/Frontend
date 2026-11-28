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

// Torn paper edge, 300 x 4 units: y 0 is where the paper continues, the fibres reach down to y 4.
// Built once from a fixed seed, so the edge is the same on every render and on both screens.
function tornEdge(seed: number) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
  const phase = random() * Math.PI * 2
  const points: string[] = []
  for (let x = 0; x < 300; x += 0.9 + random() * 2.2) {
    // A slow wave (the tear wanders) plus fine teeth, and now and then a longer fibre.
    let y = 0.4 + (Math.sin(x / 23 + phase) + 1) * 0.55 + random() * 1.7
    if (random() < 0.1) y += 1 + random()
    points.push(`${x.toFixed(1)} ${Math.min(y, 4).toFixed(2)}`)
  }
  points.push(`300 ${(0.5 + random()).toFixed(2)}`)
  const line = `M${points.join('L')}`
  return { paper: `M0 0L${points.join('L')}L300 0Z`, line }
}

const TICKET_EDGE = tornEdge(11)
const STUB_EDGE = tornEdge(29)

// The screen that tears the stub sets --tear-p (0..1, how much of the perforation is torn) and
// --tear-dir (1: the tear runs from the left, -1: from the right) on an element around the
// ticket. Without them the perforation is whole. A clipping box shifted one way with its content
// shifted back shows only part of that content: transforms only, so it stays smooth per frame.
const TORN_PART = {
  box: 'translateX(calc((var(--tear-p, 0) - 1) * var(--tear-dir, 1) * 100%))',
  content: 'translateX(calc((1 - var(--tear-p, 0)) * var(--tear-dir, 1) * 100%))',
}
const WHOLE_PART = {
  box: 'translateX(calc(var(--tear-p, 0) * var(--tear-dir, 1) * 100%))',
  content: 'translateX(calc(var(--tear-p, 0) * var(--tear-dir, 1) * -100%))',
}

function SeamPart({ part, children }: { part: typeof TORN_PART; children: ReactNode }) {
  return (
    <div className="h-full overflow-hidden" style={{ transform: part.box }}>
      <div className="h-full" style={{ transform: part.content }}>
        {children}
      </div>
    </div>
  )
}

/** The fibrous edge of one torn half; `flipped` turns it to reach up (the stub's edge). */
function TornEdge({ edge, flipped = false }: { edge: typeof TICKET_EDGE; flipped?: boolean }) {
  return (
    <svg
      viewBox="0 0 300 4"
      preserveAspectRatio="none"
      className={`block h-full w-full overflow-visible ${flipped ? '-scale-y-100' : ''}`}
    >
      <path d={edge.paper} className="fill-paper" />
      {/* A faint dark rim and the lighter inner fibres, so the edge reads on the light page. */}
      <path
        d={edge.line}
        fill="none"
        className="stroke-ink/25"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={edge.line}
        fill="none"
        className="stroke-white/80"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
        transform="translate(0 -0.5)"
      />
    </svg>
  )
}

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
    <div className="relative flex flex-col items-center gap-0.5 rounded-b-[16px] bg-paper px-5 py-[18px]">
      {renderStub && (
        // The stub's own torn edge, shown along the part that is torn (with --tear-p).
        <div aria-hidden="true" className="absolute -top-1 right-2 left-2 h-1">
          <SeamPart part={TORN_PART}>
            <TornEdge edge={STUB_EDGE} flipped />
          </SeamPart>
        </div>
      )}
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

      {stub === 'none' && (
        // Where the stub was torn off (S10), the same fibres stay on the ticket.
        <div aria-hidden="true" className="relative">
          <div className="absolute top-0 right-2 left-2 h-1">
            <TornEdge edge={TICKET_EDGE} />
          </div>
        </div>
      )}
      {stub === 'attached' && (
        <>
          {/* Zero-height line between the two halves: perforation and the punched notches stay
              with the main half when the stub is pulled away, and sit above the stub. */}
          <div aria-hidden="true" className="relative z-10">
            {renderStub && (
              // Painted under the notches, which cover its ends like the real cut.
              <div className="absolute top-0 right-2 left-2 h-1">
                <SeamPart part={TORN_PART}>
                  <TornEdge edge={TICKET_EDGE} />
                </SeamPart>
              </div>
            )}
            <div
              className={`absolute bottom-0 left-3 w-[calc(100%-24px)] ${
                dimmed ? 'h-[1.5px] text-ink-faint' : 'h-0.5 text-gate'
              }`}
            >
              {/* The torn part of the perforation is gone: only the whole part is printed. */}
              <SeamPart part={WHOLE_PART}>
                <svg className="block h-full w-full">
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
              </SeamPart>
            </div>
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
