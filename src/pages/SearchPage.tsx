import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useEventPagesQuery } from '@/features/events/api'
import filterIcon from '@/features/events/assets/filter.svg'
import searchIcon from '@/features/events/assets/search.svg'
import xSmallIcon from '@/features/events/assets/x-small.svg'
import { categoryLabel } from '@/features/events/lib/eventText'
import { seoulDateString } from '@/features/events/lib/seoulDate'
import { useNextPageTrigger } from '@/features/events/lib/useNextPageTrigger'
import { FilterSheet } from '@/features/events/search/FilterSheet'
import { SearchResultCard, SearchResultSkeleton } from '@/features/events/search/SearchResultCard'
import {
  DATE_PRESETS,
  KEYWORD_MAX,
  countFilters,
  pickedDayLabel,
  readConditions,
  toListParams,
  writeConditions,
  type DatePreset,
  type SearchConditions,
  type SearchFilters,
  type SortOrder,
} from '@/features/events/search/searchConditions'
import { useSearchPosition } from '@/features/events/search/useSearchPosition'
import { ja } from '@/shared/i18n/ja'
import { State } from '@/shared/ui/State'
import type { EventListItem } from '@/shared/types/event'

const PAGE_SIZE = 20
const KEYWORD_DELAY = 300

const isPreset = (value: string): value is DatePreset =>
  (DATE_PRESETS as readonly string[]).includes(value)

// S03 search and filter (Figma: S03 検索・絞り込み, restyled to the 切符 look).
export function SearchPage() {
  const t = ja.search
  const [searchParams, setSearchParams] = useSearchParams()
  // Fixed when the screen opens so the date conditions (and the query) don't move between renders.
  const [now] = useState(() => new Date())
  const today = seoulDateString(now)
  const conditions = readConditions(searchParams, today)
  const [sheetOpen, setSheetOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Every change goes through the URL. It starts from the address bar as it is now, not from this
  // render's copy: a late callback (position answer, timer) must not bring back old conditions.
  const setParamsRef = useRef(setSearchParams)
  useEffect(() => {
    setParamsRef.current = setSearchParams
  })
  const update = useCallback(
    (next: Partial<SearchConditions>) => {
      const current = readConditions(new URLSearchParams(window.location.search), today)
      setParamsRef.current(writeConditions({ ...current, ...next }), { replace: true })
    },
    [today],
  )

  // Keyword: typed text is sent 300 ms after the last key, or at once on Enter.
  const [draft, setDraft] = useState(conditions.keyword)
  const [syncedKeyword, setSyncedKeyword] = useState(conditions.keyword)
  if (syncedKeyword !== conditions.keyword) {
    // The URL changed from outside (reset, back): show its keyword in the field.
    setSyncedKeyword(conditions.keyword)
    if (draft.trim() !== conditions.keyword) setDraft(conditions.keyword)
  }
  const typedKeyword = draft.trim().slice(0, KEYWORD_MAX)
  // While the IME is still converting (かな → 漢字) nothing is searched.
  const [composing, setComposing] = useState(false)
  useEffect(() => {
    if (composing || typedKeyword === conditions.keyword) return
    const timer = window.setTimeout(() => update({ keyword: typedKeyword }), KEYWORD_DELAY)
    return () => window.clearTimeout(timer)
  }, [composing, typedKeyword, conditions.keyword, update])

  const [autoFocus] = useState(
    () => !conditions.keyword && countFilters(conditions) === 0 && conditions.sort === 'date',
  )

  // 近い順 needs the current position. Without it the list goes back to date order.
  const [startedByDistance] = useState(conditions.sort === 'distance')
  const myPosition = useSearchPosition()
  const [locationNotice, setLocationNotice] = useState(false)
  // Only the latest ask counts; an answer that comes after the user moved on is ignored.
  const lastAsk = useRef(0)
  const askPosition = useCallback(
    (ask: () => Promise<boolean>) => {
      const id = ++lastAsk.current
      void ask().then((found) => {
        if (found || id !== lastAsk.current) return
        if (readConditions(new URLSearchParams(window.location.search), today).sort !== 'distance')
          return
        setLocationNotice(true)
        update({ sort: 'date' })
      })
    },
    [today, update],
  )

  // Opened with ?sort=distance (back button, shared link): ask for the position when the screen
  // mounts. A remount asks again (an unmount cancels the ask), condition changes do not.
  const askPositionRef = useRef(askPosition)
  useEffect(() => {
    askPositionRef.current = askPosition
  })
  const { ask } = myPosition
  useEffect(() => {
    if (startedByDistance) askPositionRef.current(ask)
  }, [startedByDistance, ask])

  const changeSort = (sort: SortOrder) => {
    update({ sort })
    setLocationNotice(false)
    if (sort === 'date') lastAsk.current += 1
    else if (!myPosition.position) askPosition(myPosition.ask)
  }

  const waitingForPosition = conditions.sort === 'distance' && !myPosition.position
  const query = useEventPagesQuery(
    toListParams(conditions, myPosition.position, now),
    PAGE_SIZE,
    !waitingForPosition,
  )
  const events = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total

  const submit = (event: FormEvent) => {
    event.preventDefault()
    update({ keyword: typedKeyword })
    // Close the on-screen keyboard so the results can be seen.
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const closeSheet = () => setSheetOpen(false)
  // Back to the filter button once the sheet is gone (the page behind is inert until then).
  const sheetWasOpen = useRef(false)
  useEffect(() => {
    if (sheetWasOpen.current && !sheetOpen) filterButtonRef.current?.focus()
    sheetWasOpen.current = sheetOpen
  }, [sheetOpen])

  const applyFilters = (filters: SearchFilters) => {
    update({ category: filters.category, date: filters.date, area: filters.area })
    closeSheet()
  }

  const resetAll = () => {
    setDraft('')
    setLocationNotice(false)
    lastAsk.current += 1
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const filterCount = countFilters(conditions)
  const activeConditions = [
    conditions.category && { key: 'category' as const, label: categoryLabel(conditions.category) },
    conditions.date && {
      key: 'date' as const,
      label: isPreset(conditions.date) ? t.dates[conditions.date] : pickedDayLabel(conditions.date),
    },
    conditions.area && { key: 'area' as const, label: t.areas[conditions.area] },
  ].filter((item) => !!item)

  return (
    <section className="flex flex-col">
      <form role="search" onSubmit={submit} className="pb-3">
        <div className="flex h-12 items-center gap-2 rounded-full border border-line bg-surface pr-1.5 pl-4 focus-within:border-ink">
          <img src={searchIcon} alt="" width={18} height={18} className="shrink-0" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            aria-label={t.inputLabel}
            placeholder={t.placeholder}
            maxLength={KEYWORD_MAX}
            // Only when the screen opens empty: coming back to results should not pop the keyboard.
            autoFocus={autoFocus}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(event) => {
              setComposing(false)
              setDraft(event.currentTarget.value)
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {draft && (
            <button
              type="button"
              onClick={() => {
                setDraft('')
                update({ keyword: '' })
                // The button goes away; keep the focus in the field.
                inputRef.current?.focus()
              }}
              aria-label={t.clear}
              className="flex size-9 shrink-0 items-center justify-center rounded-full active:bg-ink/10"
            >
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded-full bg-ink-faint"
              >
                <img src={xSmallIcon} alt="" width={10} height={10} />
              </span>
            </button>
          )}
          <button
            ref={filterButtonRef}
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={filterCount ? t.filterActive(filterCount) : t.filter}
            aria-haspopup="dialog"
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-ink transition-opacity duration-150 ease-out active:opacity-80"
          >
            <img src={filterIcon} alt="" width={18} height={18} />
            {filterCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-surface bg-gate text-[10px] font-bold text-ink"
              >
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </form>

      {activeConditions.length > 0 && (
        <ul className="flex flex-wrap gap-2 pb-3">
          {activeConditions.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => {
                  update({ [item.key]: undefined })
                  // The chip goes away; move the focus to the filter button next to it.
                  filterButtonRef.current?.focus()
                }}
                aria-label={t.removeCondition(item.label)}
                className="flex min-h-9 items-center gap-1.5 rounded-full bg-ink py-1 pr-2.5 pl-3.5 text-[13px] font-bold text-white active:opacity-85"
              >
                {item.label}
                <img src={xSmallIcon} alt="" width={10} height={10} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-3 pb-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-base/[1.5] font-bold">
            {t.resultTitle(conditions.keyword)}
          </h1>
          <p aria-live="polite" className="font-mono text-xs/[1.5] text-ink-muted">
            {total !== undefined ? t.resultCount(total) : ' '}
          </p>
        </div>
        <label className="relative flex shrink-0 items-center">
          <span className="sr-only">{t.sortLabel}</span>
          <select
            value={conditions.sort}
            onChange={(event) => changeSort(event.target.value as SortOrder)}
            className="h-10 appearance-none rounded-full border border-line bg-surface pr-8 pl-3.5 text-[13px] font-bold text-ink"
          >
            <option value="date">{t.sort.date}</option>
            <option value="distance">{t.sort.distance}</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 size-1.5 -translate-y-0.5 rotate-45 border-r-[1.5px] border-b-[1.5px] border-ink"
          />
        </label>
      </div>

      {/* Always in the page so screen readers announce the text when it appears. */}
      <p
        role="status"
        className={`text-xs empty:hidden ${locationNotice ? 'pb-3 text-danger' : 'pb-3 text-ink-muted'}`}
      >
        {locationNotice
          ? t.locationUnavailable
          : waitingForPosition && myPosition.locating
            ? t.locating
            : null}
      </p>

      <ResultList query={query} events={events} onReset={resetAll} />

      {sheetOpen && (
        <FilterSheet
          initial={{ category: conditions.category, date: conditions.date, area: conditions.area }}
          keyword={conditions.keyword}
          now={now}
          onApply={applyFilters}
          onClose={closeSheet}
        />
      )}
    </section>
  )
}

interface ResultListProps {
  query: ReturnType<typeof useEventPagesQuery>
  events: EventListItem[]
  onReset: () => void
}

function ResultList({ query, events, onReset }: ResultListProps) {
  const t = ja.search
  const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError } = query
  // Wait while any fetch runs: starting the next page would cancel a background refetch.
  const sentinelRef = useNextPageTrigger(
    () => void fetchNextPage(),
    hasNextPage && !isFetching && !isFetchNextPageError,
  )

  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <p className="sr-only">{ja.common.loading}</p>
        <SearchResultSkeleton />
        <SearchResultSkeleton />
        <SearchResultSkeleton />
      </div>
    )
  }

  if (query.isError && events.length === 0) {
    return <State kind="error" className="py-16" onRetry={() => void query.refetch()} />
  }

  if (events.length === 0) {
    return (
      <State
        kind="empty"
        className="py-16"
        title={t.empty}
        body={t.emptyHint}
        action={{ label: t.resetAll, onClick: onReset }}
      />
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id}>
            <SearchResultCard event={event} />
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
