import { Link, useParams } from 'react-router'
import { useCompanionsQuery } from '@/features/companion/api'
import { CompanionForm } from '@/features/companion/components/CompanionForm'
import { apiErrorCode } from '@/features/companion/errors'
import { ja } from '@/shared/i18n/ja'

// S07. Post a companion search for one event (login required; the route is guarded).
export function CompanionNewPage() {
  const eventId = Number(useParams().eventId)
  // The list response carries the event summary (strip, date range) and tells if I already posted.
  const { data, isPending, isError, error, refetch, isRefetching } = useCompanionsQuery(
    eventId,
    'OPEN',
  )
  const notFound = !Number.isInteger(eventId) || apiErrorCode(error) === 'EVENT_NOT_FOUND'
  const myOpenPost = data?.items.find((post) => post.isMine && post.status === 'OPEN')

  return (
    <section>
      <header className="mb-4 flex items-center gap-2">
        <Link
          to={`/events/${Number.isInteger(eventId) ? eventId : ''}/companions`}
          aria-label={ja.companionNew.close}
          className="-ml-2 px-2 text-2xl leading-none text-ink-muted"
        >
          ×
        </Link>
        <h1 className="text-xl font-bold">{ja.companionNew.title}</h1>
      </header>

      {notFound ? (
        <p className="py-12 text-center text-ink-muted">{ja.companion.eventNotFound}</p>
      ) : isPending ? (
        <p className="text-ink-muted">{ja.common.loading}</p>
      ) : isError ? (
        <div className="py-8 text-center">
          <p className="text-danger">{ja.common.error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-sm"
          >
            {ja.companion.retry}
          </button>
        </div>
      ) : (
        <CompanionForm event={data.event} myOpenPostId={myOpenPost?.id ?? null} />
      )}
    </section>
  )
}
