import { Link } from 'react-router'
import { failureBody, type CheckInFailure } from '@/features/checkin/failure'
import { ja } from '@/shared/i18n/ja'
import { directionsUrl } from '@/shared/lib/directionsUrl'
import { paths } from '@/shared/lib/paths'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import { Button } from '@/shared/ui/Button'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { GateTicket } from '@/shared/ui/GateTicket'
import { AlertIcon } from '@/shared/ui/icons/AlertIcon'
import { CheckIcon } from '@/shared/ui/icons/CheckIcon'

export interface CheckInFailedProps {
  event: JourneyEvent
  /** Participation id printed on the ticket; null when joining itself failed. */
  ticketNumber: number | null
  visitDate: Date
  failure: CheckInFailure
  /** A retry is running. */
  busy: boolean
  onRetry: () => void
}

// Stage "failed" (Figma: S09 失敗の例 + 失敗の理由 7種): faded ticket, the reason, what to do next.
export function CheckInFailed(props: CheckInFailedProps) {
  const { event, ticketNumber, visitDate, failure } = props
  // "Already checked in" is good news, so it is pink instead of the danger color.
  const done = failure.reason === 'ALREADY_VERIFIED'

  return (
    <>
      <h1 className="sr-only">{ja.checkIn.title}</h1>
      <GateTicket
        className="mx-auto mt-1.5"
        event={event}
        ticketNumber={ticketNumber}
        visitDate={visitDate}
        stub="attached"
        look="dimmed"
      />

      <div
        role="alert"
        className={`mt-12 flex flex-col gap-2.5 rounded-[14px] border bg-surface p-5 ${
          done ? 'border-gate' : 'border-danger'
        }`}
      >
        <div className="flex items-center gap-2">
          {done ? (
            <CheckIcon className="size-[22px] shrink-0 text-gate-ink" />
          ) : (
            <AlertIcon className="shrink-0 text-danger" />
          )}
          <h2 className="min-w-0 text-base leading-normal font-bold text-ink">
            {ja.checkIn.failureTitle[failure.reason]}
          </h2>
        </div>
        <div className="text-[13px] leading-[1.6] text-ink-muted">
          {failureBody(failure, event).map((paragraph) =>
            typeof paragraph === 'string' ? (
              <p key={paragraph}>{paragraph}</p>
            ) : (
              <p key={paragraph.afterVenue}>
                {paragraph.beforeVenue}
                <span lang={paragraph.venueLang}>{paragraph.venue}</span>
                {paragraph.afterVenue}
              </p>
            ),
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
        <FailureActions {...props} />
      </div>
    </>
  )
}

// Labels stay on one line; on a narrow phone the buttons go onto two rows instead.
const PRIMARY = 'flex-1 whitespace-nowrap'

// Second action on the left, main action on the right (Figma bottom bar).
function FailureActions({ event, failure, busy, onRetry }: CheckInFailedProps) {
  const { actions } = ja.checkIn
  const retry = (label: string) => (
    <Button className={PRIMARY} disabled={busy} aria-busy={busy} onClick={onRetry}>
      {busy ? ja.checkIn.checking : label}
    </Button>
  )

  switch (failure.reason) {
    case 'PERMISSION_DENIED':
      // The Figma sheet has "設定を開く" here, but a web page cannot open the OS settings.
      return (
        <>
          <Link
            to={paths.eventDetail(event.id)}
            className={buttonClassName({ variant: 'outline' })}
          >
            {actions.later}
          </Link>
          {retry(actions.retryCheck)}
        </>
      )
    case 'OUT_OF_RANGE':
      return (
        <>
          {event.lat !== null && event.lng !== null && (
            <a
              href={directionsUrl(event.lat, event.lng)}
              target="_blank"
              rel="noreferrer"
              className={`${buttonClassName({ variant: 'outline' })} ${PRIMARY}`}
            >
              {actions.venueMap}
            </a>
          )}
          {retry(actions.retryCheck)}
        </>
      )
    case 'EVENT_ENDED':
    case 'EVENT_NOT_STARTED':
    // Trying again cannot help: the event itself has no venue position.
    case 'EVENT_LOCATION_UNAVAILABLE':
      return (
        <Link to={paths.home()} className={`${buttonClassName()} ${PRIMARY}`}>
          {actions.otherEvents}
        </Link>
      )
    case 'ALREADY_VERIFIED':
      return (
        <Link to={paths.missions(event.id)} className={`${buttonClassName()} ${PRIMARY}`}>
          {actions.missions}
        </Link>
      )
    default:
      return retry(actions.retry)
  }
}
