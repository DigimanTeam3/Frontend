import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import { apiErrorCode } from '@/shared/lib/apiError'
import type { Participation, VerifyRequest, VerifyResult } from '@/shared/types/participation'

/** Create-or-get: answers the participation I already have when there is one. */
export function createParticipation(eventId: number) {
  return apiClient<Participation>(`/events/${eventId}/participation`, { method: 'POST' })
}

/** The participation after a passed check-in: the verify answer only carries what changed. */
export function withVerification(
  participation: Participation,
  result: VerifyResult,
): Participation {
  return {
    ...participation,
    status: result.status,
    verificationMethod: 'gps',
    verifiedAt: result.verifiedAt,
  }
}

/** Sends my position; the server decides whether it is inside the venue radius. */
export function verifyParticipation(participationId: number, position: VerifyRequest) {
  return apiClient<VerifyResult>(`/participations/${participationId}/verify`, {
    method: 'POST',
    body: JSON.stringify(position),
  })
}

export function useCreateParticipationMutation(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => createParticipation(eventId),
    onSuccess: (participation) => {
      queryClient.setQueryData(queryKeys.participations.byEvent(eventId), participation)
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.all })
    },
  })
}

export function useVerifyParticipationMutation(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { participationId: number; position: VerifyRequest }) =>
      verifyParticipation(input.participationId, input.position),
    onSuccess: (result) => {
      const participationKey = queryKeys.participations.byEvent(eventId)
      // The next screens (badge, missions) read the verified participation from the cache.
      queryClient.setQueryData<Participation | null>(participationKey, (participation) =>
        participation ? withVerification(participation, result) : participation,
      )
      // Nothing cached to update (the cache was cleared meanwhile): read it again.
      if (!queryClient.getQueryData(participationKey)) {
        void queryClient.invalidateQueries({ queryKey: participationKey })
      }
      // The mission list (isVerified, unlocked rows) depends on the check-in; do not serve a stale one.
      void queryClient.invalidateQueries({ queryKey: queryKeys.missions.byEvent(eventId) })
      // My Page: the verified count, the participation badge and the participation list.
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.all })
    },
    onError: (error) => {
      // Checked in before (another tab or device): what is cached here is out of date.
      if (apiErrorCode(error) === 'ALREADY_VERIFIED') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.participations.byEvent(eventId),
        })
        void queryClient.invalidateQueries({ queryKey: queryKeys.missions.byEvent(eventId) })
      }
    },
  })
}
