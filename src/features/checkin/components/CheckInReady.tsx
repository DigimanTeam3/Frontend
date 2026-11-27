import type { CheckInReading } from '@/features/checkin/useCheckIn'
import { useStubTear, type TearPhase } from '@/features/checkin/useStubTear'
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

// The stub follows the finger without delay, springs back with a small overshoot, and falls
// away when torn. duration-300 belongs to TEAR_ANIMATION_MS in useStubTear.
const STUB_MOTION: Record<TearPhase, string> = {
  idle: 'cursor-grab transition-transform duration-300 ease-[cubic-bezier(0.2,1.4,0.4,1)] motion-reduce:transition-none',
  dragging: 'cursor-grabbing transition-none',
  tearing: 'transition-[transform,opacity] duration-300 ease-in',
}

// Stage "ready" (Figma: S09 改札可能 + S10 改札 切り取り中): the server accepted the position.
// Pulling the stub down past 96px, or tapping the pill below, tears the ticket.
export function CheckInReady({
  event,
  ticketNumber,
  visitDate,
  reading,
  onTorn,
}: CheckInReadyProps) {
  const { ready } = ja.checkIn
  const tear = useStubTear(onTorn)
  // The glow frames the whole ticket, so it goes as soon as the stub leaves its place.
  const pulled = tear.offsetY > 0 || tear.phase === 'tearing'

  return (
    <div className="flex flex-col items-center">
      <h1 className="sr-only">{ja.checkIn.title}</h1>
      <p
        role="status"
        className="bg-gate/15 text-gate inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[15px] leading-[1.65] font-bold"
      >
        <span aria-hidden="true" className="bg-gate size-2.5 shrink-0 rounded-full" />
        {ready.chip}
      </p>
      <p className="mt-px text-center font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] whitespace-pre-wrap text-ink-muted">
        {ready.reading(formatDistance(reading.distanceM), reading.accuracyM)}
      </p>

      {/* z-10: the pulled stub passes over the pill below it. */}
      <GateTicket
        className="z-10 mt-[15px]"
        event={event}
        ticketNumber={ticketNumber}
        visitDate={visitDate}
        stub="attached"
        look={pulled ? 'plain' : 'glowing'}
        renderStub={(stub) => (
          <div
            role="button"
            tabIndex={0}
            aria-label={ready.stubLabel}
            {...tear.stubHandlers}
            style={tear.stubStyle}
            // touch-none: a pull that starts on the stub must not scroll or refresh the page.
            className={`touch-none rounded-b-[16px] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${STUB_MOTION[tear.phase]}`}
          >
            {stub}
          </div>
        )}
      />

      {/* A real button: pull gestures can collide with the browser's pull-to-refresh, so a
          tap has to tear the ticket too. */}
      <button
        type="button"
        onClick={tear.tear}
        disabled={tear.phase === 'tearing'}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[15px] leading-[1.65] font-bold text-white transition-opacity duration-150 ease-out active:opacity-80"
      >
        <ChevronRightIcon className="size-4 shrink-0 rotate-90" />
        {ready.pull}
      </button>
    </div>
  )
}
