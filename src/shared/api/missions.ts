import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { MissionListAnswer, MissionListResponse } from '@/shared/types/mission'

// The missions of one event with my progress. In shared/ because the mission screens (S11, S12)
// and the card detail (S14) both read them.

/** The server's answer in the shape the screens read. */
export function toMissionList(answer: MissionListAnswer): MissionListResponse {
  return {
    items: answer.items,
    requiredCount: answer.progress.totalRequired,
    myCompletedRequiredCount: answer.progress.completedRequired,
    isVerified: answer.canSubmit,
  }
}

// The auth header is optional here: without a login the answer has isVerified false and no submissions.
export async function getMissions(eventId: number) {
  return toMissionList(await apiClient<MissionListAnswer>(`/events/${eventId}/missions`))
}

export function useMissionsQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.missions.byEvent(eventId ?? 0),
    queryFn: () => getMissions(eventId ?? 0),
    enabled: eventId !== null,
    retry: retryUnlessClientError,
  })
}
