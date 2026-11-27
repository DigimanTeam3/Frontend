// TODO(api): provisional — no backend API for notifications yet (LINE alert for saved conditions). Path and fields are placeholders for the mock only.
import { Link, useNavigate, useParams } from 'react-router'
import { useNotificationQuery } from '@/features/notification/api'
import { MatchedEventCard } from '@/features/notification/components/MatchedEventCard'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode, apiErrorStatus } from '@/shared/lib/apiError'
import { paths, parseIdParam } from '@/shared/lib/paths'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// 404 NOTIFICATION_NOT_FOUND; a 404 without a body counts too.
function isNotificationNotFound(error: unknown) {
  const code = apiErrorCode(error)
  return code === 'NOTIFICATION_NOT_FOUND' || (code === null && apiErrorStatus(error) === 404)
}

// S18 (/notifications/:notificationId): the page a LINE alert opens when a new event matches a
// saved condition (予約券). Shows the condition, the event, and leads on to the event or the tickets.
export function NotificationEventScreen() {
  const { notification: copy } = ja
  const navigate = useNavigate()
  const notificationId = parseIdParam(useParams().notificationId)
  const query = useNotificationQuery(notificationId)
  const notification = query.data

  if (notification) {
    return (
      <section className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] leading-[1.4] font-bold text-ink">{copy.title}</h1>
          <p className="text-[13px] leading-[1.6] text-ink-muted">
            {copy.conditionLead}
            <span className="block font-bold break-words text-ink">
              {copy.condition(notification.condition)}
            </span>
          </p>
        </div>
        <MatchedEventCard event={notification.event} />
        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          <Link
            to={paths.eventDetail(notification.event.id)}
            className={buttonClassName({ variant: 'primary', fullWidth: true })}
          >
            {copy.viewEvent}
          </Link>
          <Link
            to={paths.tickets()}
            className={buttonClassName({ variant: 'ghost', fullWidth: true })}
          >
            {copy.viewTickets}
          </Link>
        </div>
      </section>
    )
  }

  // No heading is visible while loading or failing, so the name stays for screen readers.
  const heading = <h1 className="sr-only">{copy.title}</h1>

  if (notificationId === null || isNotificationNotFound(query.error)) {
    return (
      <section className="flex flex-1 flex-col">
        {heading}
        <State
          kind="error"
          className="my-auto"
          icon={<SearchIcon />}
          title={copy.notFound.title}
          action={{ label: copy.notFound.home, onClick: () => void navigate(paths.home()) }}
        />
      </section>
    )
  }

  if (query.isError) {
    const errorCopy =
      apiErrorCode(query.error) === 'UNAUTHORIZED' ? copy.errors.UNAUTHORIZED : copy.errors.UNKNOWN
    return (
      <section className="flex flex-1 flex-col">
        {heading}
        <State
          kind="error"
          className="my-auto"
          title={errorCopy.title}
          body={errorCopy.body}
          onRetry={() => void query.refetch()}
        />
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col">
      {heading}
      <State kind="loading" />
    </section>
  )
}
