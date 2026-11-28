import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventListItem, EventListResponse } from '@/shared/types/event'

// The map draws every event at once. The server answers at most 100 per page (spec: issue #14),
// so the first page tells the total and the rest are fetched together.
const MAP_PAGE_SIZE = 100
// A guard against a wrong total: 20 pages is 2,000 events, far above what Seoul has.
const MAP_MAX_PAGES = 20

function getMapEventsPage(page: number, signal?: AbortSignal) {
  return apiClient<EventListResponse>(`/events?page=${page}&size=${MAP_PAGE_SIZE}`, { signal })
}

export async function getMapEvents(signal?: AbortSignal): Promise<EventListItem[]> {
  const first = await getMapEventsPage(1, signal)
  const pageCount = Math.min(Math.ceil(first.total / MAP_PAGE_SIZE), MAP_MAX_PAGES)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => getMapEventsPage(i + 2, signal)),
  )

  // An event can move between pages while they load (the list changes): keep each id once.
  const byId = new Map<number, EventListItem>()
  for (const item of [first, ...rest].flatMap((page) => page.items)) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
}

/** All events for S04. Items only, like useEventsQuery. */
export function useMapEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.map(),
    queryFn: ({ signal }) => getMapEvents(signal),
  })
}
