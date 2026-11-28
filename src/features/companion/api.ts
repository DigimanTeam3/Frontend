import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { apiErrorCode } from '@/shared/api/errors'
import { queryKeys } from '@/shared/api/queryKeys'
import { useAuthStore } from '@/shared/stores/authStore'
import type {
  CompanionListFilter,
  CompanionListResponse,
  CompanionPostDetail,
  CreateCompanionBody,
} from '@/shared/types/companion'

const LIST_SIZE = 50

export function getCompanions(eventId: number, filter: CompanionListFilter) {
  const params = new URLSearchParams({ status: filter, page: '1', size: String(LIST_SIZE) })
  return apiClient<CompanionListResponse>(`/events/${eventId}/companions?${params}`)
}

export function useCompanionsQuery(eventId: number, filter: CompanionListFilter) {
  const signedIn = useAuthStore((state) => state.accessToken !== null)
  return useQuery({
    queryKey: queryKeys.companions.list(eventId, filter, signedIn),
    queryFn: () => getCompanions(eventId, filter),
    enabled: Number.isInteger(eventId) && eventId > 0,
  })
}

export function createCompanion(eventId: number, body: CreateCompanionBody) {
  return apiClient<CompanionPostDetail>(`/events/${eventId}/companions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function useCreateCompanionMutation(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCompanionBody) => createCompanion(eventId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.companions.lists() })
    },
    // Someone (another tab) already posted: refetch so the screen shows the existing post.
    onError: (error) => {
      if (apiErrorCode(error) === 'ALREADY_POSTED') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.companions.lists() })
      }
    },
  })
}
