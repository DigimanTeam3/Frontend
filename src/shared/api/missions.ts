import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Mission, MissionListResponse, MissionProgress } from '@/shared/types/mission'

// The missions of one event with my progress. In shared/ because the mission screens (S11, S12)
// and the card detail (S14) both read them.

// TODO(api): the spec (v2) only names `canSubmit`, `progress` and `mySubmission` for this answer,
// not its exact shape. Until that is known both forms are read: the names of the spec and the
// earlier ones (`isVerified` and the two counts).
interface RawMissionList {
  items?: Mission[]
  isVerified?: boolean
  canSubmit?: boolean
  requiredCount?: number
  myCompletedRequiredCount?: number
  progress?: Partial<MissionProgress>
}

export function toMissionList(raw: RawMissionList): MissionListResponse {
  const items = raw.items ?? []
  const required = items.filter((mission) => mission.required)
  return {
    items,
    requiredCount: raw.requiredCount ?? raw.progress?.totalRequired ?? required.length,
    myCompletedRequiredCount:
      raw.myCompletedRequiredCount ??
      raw.progress?.completedRequired ??
      required.filter((mission) => mission.mySubmission).length,
    isVerified: raw.isVerified ?? raw.canSubmit ?? false,
  }
}

// The auth header is optional here: without a login the answer has isVerified false and no submissions.
export async function getMissions(eventId: number) {
  return toMissionList(await apiClient<RawMissionList>(`/events/${eventId}/missions`))
}

export function useMissionsQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.missions.byEvent(eventId ?? 0),
    queryFn: () => getMissions(eventId ?? 0),
    enabled: eventId !== null,
    retry: retryUnlessClientError,
  })
}
