import { useNavigate } from 'react-router'
import { ParticipationStamp } from '@/features/badge/components/ParticipationStamp'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { formatMonthDay, formatTime } from '@/shared/lib/seoulDate'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import { Button } from '@/shared/ui/Button'
import { GateTicket } from '@/shared/ui/GateTicket'

export interface BadgeEarnedProps {
  event: JourneyEvent
  /** Participation id printed on the ticket. */
  ticketNumber: number
  /** When the check-in passed (ISO 8601). */
  earnedAt: string
}

// The stamp sticks out 34.5px past the ticket's right edge and its turned box 9.5px more. On a
// narrow screen the room beside the 300px ticket is smaller, so the stamp moves in with it
// (it never makes the page scroll sideways).
const STAMP_RIGHT = 'calc(-1 * min(34.5px, (100vw - 300px) / 2 - 9.5px))'

// Stage "earned" (Figma: S10 参加バッジ獲得): the torn ticket with its punch hole, the stamp on
// its corner, and the way on to the missions. An event without missions (`missionCount` 0) has
// no way on: the buttons lead back to the event and to My Page, where the badge is kept.
export function BadgeEarned({ event, ticketNumber, earnedAt }: BadgeEarnedProps) {
  const navigate = useNavigate()
  const { participationBadge: copy } = ja
  const date = formatMonthDay(earnedAt)
  const venue = event.venueNameJa ?? event.venueName
  const hasNoMissions = event.missionCount === 0

  return (
    <>
      <h1 className="sr-only">{copy.title}</h1>
      {/* mt-[52px]: room for the stamp, which reaches above the ticket. */}
      <div className="relative mx-auto mt-[52px] w-[300px] max-w-full">
        <GateTicket
          event={event}
          ticketNumber={ticketNumber}
          visitDate={earnedAt}
          stub="none"
          punched
        />
        {/* The stamp lands on the corner after the ticket is there. Plays only with motion on. */}
        {/* Separate positioned wrapper: the stamp itself is `relative`, which would beat `absolute`. */}
        <div className="absolute -top-[47px] z-10" style={{ right: STAMP_RIGHT }}>
          {/* Starts smaller (a bigger start would reach past the screen edge). Without motion or
              @starting-style support it simply shows in its final state. */}
          <ParticipationStamp
            date={date}
            className="motion-safe:transition-[scale,opacity] motion-safe:delay-300 motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.2,1.4,0.4,1)] motion-safe:starting:scale-[0.6] motion-safe:starting:opacity-0"
          />
        </div>
      </div>

      <div className="mt-9 flex flex-col items-center gap-2 text-center">
        <p
          aria-hidden="true"
          className="font-mincho text-[30px] leading-[1.3] font-extrabold tracking-[0.01em] text-ink"
        >
          {copy.title}
        </p>
        <p className="text-[15px] leading-[1.65] text-ink-muted">
          {copy.body(event.missionCount).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p className="font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] break-words whitespace-pre-wrap text-ink-faint">
          {copy.metaBeforeVenue(date, formatTime(earnedAt))}
          <span lang={event.venueNameJa === null ? 'ko' : undefined}>{venue}</span>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-8">
        {hasNoMissions ? (
          <>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate(paths.eventDetail(event.id))}
            >
              {copy.actions.backToEvent}
            </Button>
            <Button variant="ghost" size="sm" fullWidth onClick={() => navigate(paths.me())}>
              {copy.actions.myPage}
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" fullWidth onClick={() => navigate(paths.missions(event.id))}>
              {copy.actions.missions}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => navigate(paths.eventDetail(event.id))}
            >
              {copy.actions.later}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
