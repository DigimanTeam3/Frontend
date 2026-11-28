import { Link, useParams, useSearchParams } from 'react-router'
import { useCompanionsQuery } from '@/features/companion/api'
import { CompanionCard } from '@/features/companion/components/CompanionCard'
import { EventStrip } from '@/features/companion/components/EventStrip'
import { apiErrorCode } from '@/features/companion/errors'
import { ja } from '@/shared/i18n/ja'
import type { CompanionListFilter } from '@/shared/types/companion'

const FILTERS: { value: CompanionListFilter; label: string }[] = [
  { value: 'OPEN', label: ja.companion.filterOpen },
  { value: 'ALL', label: ja.companion.filterAll },
]

// S06. Companion posts for one event. Viewing needs no login; opening a post does (S08).
export function CompanionListPage() {
  const eventId = Number(useParams().eventId)
  // The query stays disabled for a bad id, so treat it as not found instead of loading forever.
  const validEventId = Number.isInteger(eventId) && eventId > 0
  const [searchParams, setSearchParams] = useSearchParams()
  const filter: CompanionListFilter = searchParams.get('status') === 'all' ? 'ALL' : 'OPEN'
  const { data, isPending, isError, error, refetch, isRefetching } = useCompanionsQuery(
    eventId,
    filter,
  )

  const selectFilter = (value: CompanionListFilter) => {
    setSearchParams(value === 'ALL' ? { status: 'all' } : {}, { replace: true })
  }

  const myOpenPost = data?.items.find((post) => post.isMine && post.status === 'OPEN')
  const notFound = !validEventId || apiErrorCode(error) === 'EVENT_NOT_FOUND'

  return (
    <section className="flex min-h-full flex-col">
      {/* Back to the event is in the shared top bar (RootLayout). */}
      <h1 className="mb-4 text-xl font-bold">{ja.companion.listTitle}</h1>

      {notFound ? (
        <p className="py-12 text-center text-ink-muted">{ja.companion.eventNotFound}</p>
      ) : (
        <>
          {data && <EventStrip event={data.event} />}

          <div role="group" className="mt-4 flex gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => selectFilter(value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
                  filter === value
                    ? 'border-primary bg-primary text-surface'
                    : 'border-line bg-surface text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex-1">
            {isPending && <p className="text-ink-muted">{ja.common.loading}</p>}
            {isError && (
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
            )}
            {data?.items.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-ink-muted">
                  {filter === 'OPEN' ? ja.companion.emptyOpen : ja.companion.emptyAll}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{ja.companion.emptyHint}</p>
              </div>
            )}
            <ul className="flex flex-col gap-3">
              {data?.items.map((post) => (
                <li key={post.id}>
                  <CompanionCard post={post} />
                </li>
              ))}
            </ul>
          </div>

          {data && (
            // Floats above the tab bar while scrolling.
            <div className="pointer-events-none sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-6 flex justify-end">
              <Link
                to={
                  myOpenPost ? `/companions/${myOpenPost.id}` : `/events/${eventId}/companions/new`
                }
                className="pointer-events-auto rounded-2xl bg-primary px-5 py-3.5 font-bold text-surface shadow-lg"
              >
                {myOpenPost ? ja.companion.viewMine : `＋ ${ja.companion.create}`}
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
