import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useEventPagesQuery } from '@/features/events/api'
import searchIcon from '@/features/events/assets/search.svg'
import { EventTicket, EventTicketSkeleton } from '@/features/events/components/ticket/EventTicket'
import { categoryLabel } from '@/features/events/lib/eventText'
import { seoulDateString, seoulHeaderDate } from '@/features/events/lib/seoulDate'
import { ja } from '@/shared/i18n/ja'
import type { EventCategory, EventSummary } from '@/shared/types/event'

const PAGE_SIZE = 10
const CATEGORIES: EventCategory[] = ['festival', 'exhibition', 'performance']

function parseCategory(value: string | null): EventCategory | undefined {
  return CATEGORIES.find((category) => category === value)
}

// S02 home: tickets you can still go to, newest first (Figma: Concept 切符 / S02-k4).
export function HomePage() {
  const t = ja.home
  const [searchParams, setSearchParams] = useSearchParams()
  const category = parseCategory(searchParams.get('category'))
  const today = seoulDateString()
  const query = useEventPagesQuery({ category, dateFrom: today }, PAGE_SIZE)
  const events = query.data?.pages.flatMap((page) => page.items) ?? []

  const selectCategory = (next: EventCategory | undefined) =>
    setSearchParams(next ? { category: next } : {}, { replace: true })

  return (
    <section className="flex flex-col">
      <header className="flex flex-col gap-0.5 pt-2 pb-3">
        <p className="font-mono text-[10px]/[1.4] font-medium tracking-[0.14em] whitespace-pre text-ink-muted">
          {`${t.place}  ·  ${seoulHeaderDate()}`}
        </p>
        <h1 className="font-mincho text-2xl/[1.4] font-extrabold">{t.title}</h1>
      </header>

      {/* Entrances to S03 search and S16 AI desk. Not in Figma yet (proposal). */}
      <div className="flex gap-2 pb-4">
        <Link
          to="/search"
          className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-ink-muted transition-colors duration-150 ease-out active:bg-line/40"
        >
          <img src={searchIcon} alt="" width={18} height={18} />
          <span className="truncate">{t.search}</span>
        </Link>
        <Link
          to="/concierge"
          className="flex h-11 shrink-0 items-center rounded-full bg-ink px-4 text-sm font-bold text-surface transition-opacity duration-150 ease-out active:opacity-80"
        >
          {t.askAi}
        </Link>
      </div>

      <nav aria-label={t.categories} className="pb-3">
        <ul className="flex gap-5">
          {[undefined, ...CATEGORIES].map((value) => {
            const active = value === category
            return (
              <li key={value ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(value)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 text-sm/[1.4] transition-colors duration-150 ease-out ${
                    active ? 'font-bold text-ink' : 'text-ink-muted'
                  }`}
                >
                  {value ? categoryLabel(value) : t.all}
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-7 transition-colors duration-150 ${active ? 'bg-ink' : 'bg-transparent'}`}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <HomeList
        query={query}
        events={events}
        category={category}
        onShowAll={() => selectCategory(undefined)}
      />
    </section>
  )
}

interface HomeListProps {
  query: ReturnType<typeof useEventPagesQuery>
  events: EventSummary[]
  category: EventCategory | undefined
  onShowAll: () => void
}

function HomeList({ query, events, category, onShowAll }: HomeListProps) {
  const t = ja.home
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = query
  const sentinelRef = useNextPageTrigger(
    () => void fetchNextPage(),
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  )

  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <p className="sr-only">{ja.common.loading}</p>
        <EventTicketSkeleton />
        <EventTicketSkeleton />
        <EventTicketSkeleton />
      </div>
    )
  }

  if (query.isError && events.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-danger">{ja.common.error}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="rounded-[14px] bg-ink px-5 py-3 text-[15px] font-bold text-surface"
        >
          {t.retry}
        </button>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line px-6 py-12 text-center">
        <p className="text-sm text-ink-muted">{category ? t.emptyCategory : t.empty}</p>
        {category && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-sm font-bold text-ink underline underline-offset-4"
          >
            {t.showAll}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {events.map((event) => (
          <li key={event.id}>
            <EventTicket event={event} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-4">
        {isFetchingNextPage && <p className="text-xs text-ink-muted">{ja.common.loading}</p>}
        {isFetchNextPageError && (
          <p role="alert" className="flex items-center gap-3 text-xs text-danger">
            {t.loadMoreError}
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              className="font-bold text-ink underline underline-offset-4"
            >
              {t.retry}
            </button>
          </p>
        )}
      </div>
    </>
  )
}

// Loads the next page when the end of the list comes near the screen.
function useNextPageTrigger(load: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadRef.current()
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}
