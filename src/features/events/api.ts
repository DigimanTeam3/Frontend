import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventListResponse } from '@/shared/types/event'

export function getEvents() {
  return apiClient<EventListResponse>('/events')
}

/** Event list items (S02 home, S04 map). */
export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.list(),
    queryFn: getEvents,
    select: (data) => data.items,
  })
}
