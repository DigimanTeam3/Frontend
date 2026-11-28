import { useQuery } from '@tanstack/react-query'
import { ApiError, apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventDetail, EventListResponse } from '@/shared/types/event'

export function getEvents() {
  return apiClient<EventListResponse>('/events')
}

export function getEventDetail(eventId: number) {
  return apiClient<EventDetail>(`/events/${eventId}`)
}

/** Event list items (S02 home, S04 map). */
export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.list(),
    queryFn: getEvents,
    select: (data) => data.items,
  })
}

export function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

/** Event detail (S05). Pass null for an id that is not a number; nothing is fetched. */
export function useEventDetailQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId ?? -1),
    queryFn: () => getEventDetail(eventId as number),
    enabled: eventId !== null,
    // A missing event stays missing; only retry network and server errors.
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 1,
  })
}
