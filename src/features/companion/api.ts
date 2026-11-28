import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import { useAuthStore } from '@/shared/stores/authStore'
import type { CompanionListFilter, CompanionListResponse } from '@/shared/types/companion'

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
