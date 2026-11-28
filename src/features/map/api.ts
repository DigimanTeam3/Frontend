import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventListResponse } from '@/shared/types/event'

// The map draws every event at once, so it asks for the largest page (spec: issue #14).
const MAP_PAGE_SIZE = 100

export function getMapEvents() {
  return apiClient<EventListResponse>(`/events?page=1&size=${MAP_PAGE_SIZE}`)
}

/** All events for S04. Items only, like useEventsQuery. */
export function useMapEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.map(),
    queryFn: getMapEvents,
    select: (data) => data.items,
  })
}
