import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { getMyBadges } from '@/shared/api/badges'
import { queryKeys } from '@/shared/api/queryKeys'
import type { MyCompanion, MyParticipation, MySummary, User } from '@/shared/types/me'
import type { Page } from '@/shared/types/page'

// Page size that holds every participation (and every companion post) for now.
const PARTICIPATION_PAGE_SIZE = 100
const COMPANION_PAGE_SIZE = 100

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: () => apiClient<User>('/me'),
  })
}

export function useMySummaryQuery() {
  return useQuery({
    queryKey: queryKeys.me.summary(),
    queryFn: () => apiClient<MySummary>('/me/summary'),
  })
}

// TODO(api): the badge list does not say how many badges exist in total, so the "4 / 12" of the
// Figma is shown as the earned count only.
export function useAllMyBadgesQuery() {
  return useQuery({
    queryKey: queryKeys.me.badges(),
    queryFn: () => getMyBadges(),
  })
}

export function useMyParticipationsQuery() {
  return useQuery({
    queryKey: queryKeys.me.participations(),
    queryFn: () => {
      const query = new URLSearchParams({ page: '1', size: String(PARTICIPATION_PAGE_SIZE) })
      return apiClient<Page<MyParticipation>>(`/me/participations?${query}`)
    },
  })
}

export function useMyCompanionsQuery() {
  return useQuery({
    queryKey: queryKeys.me.companions(),
    queryFn: () => {
      const query = new URLSearchParams({ page: '1', size: String(COMPANION_PAGE_SIZE) })
      return apiClient<Page<MyCompanion>>(`/me/companions?${query}`)
    },
  })
}
