import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { MissionListResponse } from '@/shared/types/mission'

// The missions of one event with my progress. In shared/ because the mission screens (S11, S12)
// and the card detail (S14) both read them.

// The auth header is optional here: without a login the answer has isVerified false and no submissions.
export function getMissions(eventId: number) {
  return apiClient<MissionListResponse>(`/events/${eventId}/missions`)
}

export function useMissionsQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.missions.byEvent(eventId ?? 0),
    queryFn: () => getMissions(eventId ?? 0),
    enabled: eventId !== null,
    retry: retryUnlessClientError,
  })
}
