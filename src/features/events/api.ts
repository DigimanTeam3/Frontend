import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiError, apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventCategory, EventDetail, EventListResponse } from '@/shared/types/event'

/** Query values of GET /api/events (issue #12). */
export interface EventListParams {
  category?: EventCategory
  /** YYYY-MM-DD (Seoul). Only events still open on or after this day. */
  dateFrom?: string
  page?: number
  size?: number
}

function toQueryString(params: object) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function getEvents(params: EventListParams = {}) {
  return apiClient<EventListResponse>(`/events${toQueryString(params)}`)
}

export function getEventDetail(eventId: number) {
  return apiClient<EventDetail>(`/events/${eventId}`)
}

/** Event list items (S04 map). */
export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.list(),
    queryFn: () => getEvents(),
    select: (data) => data.items,
  })
}

/** Event list loaded page by page (S02 home). */
export function useEventPagesQuery(params: Omit<EventListParams, 'page' | 'size'>, size: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.events.pages({ ...params, size }),
    queryFn: ({ pageParam }) => getEvents({ ...params, page: pageParam, size }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.size < last.total ? last.page + 1 : undefined),
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
