import type { CheckInReading } from '@/features/checkin/useCheckIn'
import { useStubTear } from '@/features/checkin/useStubTear'
import { ja } from '@/shared/i18n/ja'
import { formatDistance } from '@/shared/lib/formatDistance'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import { GateTicket } from '@/shared/ui/GateTicket'
import { ChevronRightIcon } from '@/shared/ui/icons/ChevronRightIcon'

export interface CheckInReadyProps {
  event: JourneyEvent
  /** Participation id printed on the ticket. */
  ticketNumber: number
  visitDate: Date
  reading: CheckInReading
  /** The stub is torn off (after its fall): go on to the badge. */
  onTorn: () => void
}

// Stage "ready" (Figma: S09 改札可能 + S10 改札 切り取り中): the server accepted the position.
// Pulling the stub tears it along the perforation like paper: the tear runs from the side it is
// held at, holds at each hole, springs back when let go early, and comes off past 96px. A tap,
// Enter / Space on the stub, or the pill below plays the same tear by itself.
export function CheckInReady({
  event,
  ticketNumber,
  visitDate,
  reading,
  onTorn,
}: CheckInReadyProps) {
  const { ready } = ja.checkIn
  const tear = useStubTear(onTorn)

  return (
    <div className="flex flex-col items-center">
      <h1 className="sr-only">{ja.checkIn.title}</h1>
      <p
        role="status"
        className="inline-flex items-center gap-2 rounded-full bg-gate-soft px-3.5 py-2 text-[15px] leading-[1.65] font-bold text-gate-ink"
      >
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-gate" />
        {ready.chip}
      </p>
      <p className="mt-px text-center font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] whitespace-pre-wrap text-ink-muted">
        {ready.reading(formatDistance(reading.distanceM), reading.accuracyM)}
      </p>

      {/* z-10: the pulled stub passes over the pill below it. The wrapper carries the tear
          progress for the seam (see useStubTear). */}
      <div ref={tear.rootRef} className="relative z-10 mt-[15px] w-[300px] max-w-full">
        <GateTicket
          event={event}
          ticketNumber={ticketNumber}
          visitDate={visitDate}
          stub="attached"
          // The glow frames the whole ticket, so it goes while the stub is out of its place.
          look={tear.away ? 'plain' : 'glowing'}
          renderStub={(stub) => (
            <div
              ref={tear.stubRef}
              role="button"
              tabIndex={0}
              aria-label={ready.stubLabel}
              aria-disabled={tear.leaving || undefined}
              {...tear.stubHandlers}
              // touch-none: a pull that starts on the stub must not scroll or refresh the page.
              // isolate: its shadow stays behind the stub, not behind the whole ticket.
              className={`relative isolate touch-none rounded-b-[16px] will-change-transform select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                tear.leaving ? '' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <div
                ref={tear.shadowRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-b-[16px] bg-ink/60 opacity-0 blur-md will-change-transform"
              />
              {stub}
              {/* Shading: the stub turns away from the light as it opens. */}
              <div
                ref={tear.lightRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-b-[16px] bg-linear-to-b from-ink/0 to-ink/10 opacity-0"
              />
            </div>
          )}
        />
      </div>

      {/* A real button: pull gestures can collide with the browser's pull-to-refresh, so a
          tap has to tear the ticket too. */}
      <button
        type="button"
        onClick={tear.tear}
        disabled={tear.leaving}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[15px] leading-[1.65] font-bold text-white transition-opacity duration-150 ease-out active:opacity-80"
      >
        <ChevronRightIcon className="size-4 shrink-0 rotate-90" />
        {ready.pull}
      </button>
    </div>
  )
}
