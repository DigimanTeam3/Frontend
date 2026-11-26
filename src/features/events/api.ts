import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Event } from '@/shared/types/event'

export function getEvents() {
  return apiClient<Event[]>('/events')
}

export function useEventsQuery() {
  return useQuery({ queryKey: queryKeys.events.list(), queryFn: getEvents })
}
