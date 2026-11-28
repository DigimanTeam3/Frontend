import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CheckInFailed } from '@/features/checkin/components/CheckInFailed'
import { CheckInIntro } from '@/features/checkin/components/CheckInIntro'
import { CheckInReady } from '@/features/checkin/components/CheckInReady'
import { venueRadiusM } from '@/features/checkin/failure'
import { useCheckIn } from '@/features/checkin/useCheckIn'
import { useJourneyEventQuery, useParticipationQuery } from '@/shared/api/journey'
import { ja } from '@/shared/i18n/ja'
import { isEventNotFound } from '@/shared/lib/apiError'
import { parseIdParam, paths } from '@/shared/lib/paths'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import type { Participation } from '@/shared/types/participation'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// S09 location check-in (/events/:eventId/check-in): loads the event and my participation,
// then hands over to the check-in itself.
export function CheckInScreen() {
  const navigate = useNavigate()
  const eventId = parseIdParam(useParams().eventId)
  const eventQuery = useJourneyEventQuery(eventId)
  const participationQuery = useParticipationQuery(eventId)

  const event = eventQuery.data
  const participation = participationQuery.data

  let content: ReactNode
  if (event && participation !== undefined) {
    // Checked before the error states: a failed background refetch must not close a check-in
    // that is already on screen.
    content = <CheckInFlow key={event.id} event={event} initialParticipation={participation} />
  } else if (eventId === null || isEventNotFound(eventQuery.error)) {
    content = (
      <>
        <h1 className="sr-only">{ja.checkIn.title}</h1>
        <State
          kind="error"
          className="my-auto"
          icon={<SearchIcon />}
          title={ja.eventNotFound.title}
          body={ja.eventNotFound.body}
          action={{ label: ja.eventNotFound.home, onClick: () => navigate(paths.home()) }}
        />
      </>
    )
  } else if (eventQuery.isError || participationQuery.isError) {
    content = (
      <>
        <h1 className="sr-only">{ja.checkIn.title}</h1>
        <State
          kind="error"
          className="my-auto"
          onRetry={() => {
            if (eventQuery.isError) void eventQuery.refetch()
            if (participationQuery.isError) void participationQuery.refetch()
          }}
        />
      </>
    )
  } else {
    content = (
      <>
        <h1 className="sr-only">{ja.checkIn.title}</h1>
        <State kind="loading" />
      </>
    )
  }

  // overflow-y-clip: the torn stub falls past the bottom of the screen; it must not make the page
  // taller (a scrollbar would flash and shift the layout).
  return <section className="flex flex-1 flex-col overflow-y-clip">{content}</section>
}

interface CheckInFlowProps {
  event: JourneyEvent
  /** My participation when the screen opened; null when I have none yet. */
  initialParticipation: Participation | null
}

function CheckInFlow({ event, initialParticipation }: CheckInFlowProps) {
  const navigate = useNavigate()
  const { stage, failure, reading, participation, busy, start, finishTear } = useCheckIn(
    event.id,
    initialParticipation,
  )
  // The ticket shows the day of this visit.
  const [visitDate] = useState(() => new Date())

  if (stage === 'ready' && reading && participation) {
    return (
      <CheckInReady
        event={event}
        ticketNumber={participation.id}
        // Coming back to tear the stub of an earlier check: the ticket keeps the day of that check.
        visitDate={participation.verifiedAt ? new Date(participation.verifiedAt) : visitDate}
        reading={reading}
        onTorn={() => {
          finishTear()
          navigate(paths.badge(event.id), { replace: true })
        }}
      />
    )
  }
  if (stage === 'failed' && failure) {
    return (
      <CheckInFailed
        event={event}
        ticketNumber={participation?.id ?? null}
        visitDate={visitDate}
        failure={failure}
        busy={busy}
        onRetry={start}
      />
    )
  }
  return <CheckInIntro radiusM={venueRadiusM(event)} busy={busy} onStart={start} />
}
