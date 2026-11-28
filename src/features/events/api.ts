import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiError, apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventArea, EventCategory, EventDetail, EventListResponse } from '@/shared/types/event'

/** Query values of GET /api/events (issues #12 and #13). */
export interface EventListParams {
  keyword?: string
  category?: EventCategory
  /** YYYY-MM-DD (Seoul). Only events still open on or after this day. */
  dateFrom?: string
  /** YYYY-MM-DD (Seoul). Only events starting on or before this day. */
  dateTo?: string
  area?: EventArea
  sort?: 'date' | 'distance'
  /** Current position, needed for sort=distance. */
  lat?: number
  lng?: number
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

/** Event list loaded page by page (S02 home, S03 search). Pass enabled=false to wait. */
export function useEventPagesQuery(
  params: Omit<EventListParams, 'page' | 'size'>,
  size: number,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.events.pages({ ...params, size }),
    queryFn: ({ pageParam }) => getEvents({ ...params, page: pageParam, size }),
    enabled,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.size < last.total ? last.page + 1 : undefined),
  })
}

/** Number of events for some conditions (S03 filter sheet button). Asks for one item only. */
export function useEventCountQuery(
  params: Omit<EventListParams, 'page' | 'size'>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.events.count(params),
    queryFn: () => getEvents({ ...params, page: 1, size: 1 }),
    select: (data) => data.total,
    enabled,
    placeholderData: keepPreviousData,
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
