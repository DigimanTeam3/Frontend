import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import { apiErrorCode } from '@/shared/lib/apiError'
import type { ExperienceCard } from '@/shared/types/card'
import type {
  MissionListResponse,
  Submission,
  SubmissionRequest,
  SubmissionResult,
} from '@/shared/types/mission'
import type { Page } from '@/shared/types/page'

// The list itself (getMissions / useMissionsQuery) is in @/shared/api/missions: the card detail
// (S14) reads it too.

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

/** My card list with the new card in front, so the completion screen has it before the refetch answers. */
function withCard(page: Page<ExperienceCard>, card: ExperienceCard): Page<ExperienceCard> {
  const others = page.items.filter((item) => item.id !== card.id)
  const isNew = others.length === page.items.length
  return { ...page, items: [card, ...others], total: isNew ? page.total + 1 : page.total }
}

export function useSubmitMissionMutation(eventId: number) {
  const queryClient = useQueryClient()
  const missionsKey = queryKeys.missions.byEvent(eventId)
  return useMutation({
    mutationFn: (input: { missionId: number; body: SubmissionRequest }) =>
      submitMission(input.missionId, input.body),
    onSuccess: ({ submission, experienceCard }) => {
      queryClient.setQueryData<MissionListResponse>(
        missionsKey,
        (list) => list && withSubmission(list, submission),
      )
      void queryClient.invalidateQueries({ queryKey: missionsKey })
      // The last required mission also hands out the complete badge and the experience card.
      if (experienceCard) {
        queryClient.setQueryData<Page<ExperienceCard>>(
          queryKeys.cards.mine(),
          (page) => page && withCard(page, experienceCard),
        )
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.badges.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cards.all })
      // My Page counts and badges.
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.all })
    },
    onError: (error) => {
      // Sent before (another tab or device): reload so the screen shows that submission.
      if (apiErrorCode(error) === 'ALREADY_SUBMITTED') {
        void queryClient.invalidateQueries({ queryKey: missionsKey })
      }
    },
  })
}
