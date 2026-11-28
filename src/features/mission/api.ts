import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { MissionListResponse } from '@/shared/types/mission'

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
