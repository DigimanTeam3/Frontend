import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import { apiErrorCode } from '@/shared/lib/apiError'
import type {
  MissionListResponse,
  Submission,
  SubmissionRequest,
  SubmissionResult,
} from '@/shared/types/mission'

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

/** Photo mission: `{ image, text? }`. Text mission: `{ text }`. Approved at once. */
export function submitMission(missionId: number, body: SubmissionRequest) {
  return apiClient<SubmissionResult>(`/missions/${missionId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** The list with my new submission written in, so it shows as done before the refetch answers. */
function withSubmission(list: MissionListResponse, submission: Submission): MissionListResponse {
  const items = list.items.map((mission) =>
    mission.id === submission.missionId ? { ...mission, mySubmission: submission } : mission,
  )
  return {
    ...list,
    items,
    myCompletedRequiredCount: items.filter((m) => m.required && m.mySubmission).length,
  }
}

export function useSubmitMissionMutation(eventId: number) {
  const queryClient = useQueryClient()
  const missionsKey = queryKeys.missions.byEvent(eventId)
  return useMutation({
    mutationFn: (input: { missionId: number; body: SubmissionRequest }) =>
      submitMission(input.missionId, input.body),
    onSuccess: ({ submission }) => {
      queryClient.setQueryData<MissionListResponse>(
        missionsKey,
        (list) => list && withSubmission(list, submission),
      )
      void queryClient.invalidateQueries({ queryKey: missionsKey })
      // The last required mission also hands out the complete badge and the experience card.
      void queryClient.invalidateQueries({ queryKey: queryKeys.badges.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cards.all })
    },
    onError: (error) => {
      // Sent before (another tab or device): reload so the screen shows that submission.
      if (apiErrorCode(error) === 'ALREADY_SUBMITTED') {
        void queryClient.invalidateQueries({ queryKey: missionsKey })
      }
    },
  })
}
