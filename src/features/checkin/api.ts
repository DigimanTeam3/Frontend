import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Participation, VerifyRequest, VerifyResult } from '@/shared/types/participation'

/** Create-or-get: answers the participation I already have when there is one. */
export function createParticipation(eventId: number) {
  return apiClient<Participation>(`/events/${eventId}/participation`, { method: 'POST' })
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
    },
  })
}

export function useVerifyParticipationMutation(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { participationId: number; position: VerifyRequest }) =>
      verifyParticipation(input.participationId, input.position),
    onSuccess: (result) => {
      // The next screens (badge, missions) read the verified participation from the cache.
      queryClient.setQueryData(queryKeys.participations.byEvent(eventId), result.participation)
      // The mission list (isVerified, unlocked rows) depends on the check-in; do not serve a stale one.
      void queryClient.invalidateQueries({ queryKey: queryKeys.missions.byEvent(eventId) })
    },
  })
}
