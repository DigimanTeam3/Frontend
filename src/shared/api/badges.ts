import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Badge, BadgeType } from '@/shared/types/badge'
import type { Page } from '@/shared/types/page'

// Page size that holds every badge of one type for now.
const BADGE_PAGE_SIZE = 100

// TODO(api): GET /me/badges has no eventId filter, so the screens that need the badge of one
// event load the first page and look for it there.
export function getMyBadges(badgeType?: BadgeType) {
  const query = new URLSearchParams({ page: '1', size: String(BADGE_PAGE_SIZE) })
  // Without a type the answer holds both kinds (My Page).
  if (badgeType) query.set('badgeType', badgeType)
  return apiClient<Page<Badge>>(`/me/badges?${query}`)
}

export function useMyBadgesQuery(badgeType: BadgeType, enabled = true) {
  return useQuery({
    queryKey: queryKeys.badges.mine(badgeType),
    queryFn: () => getMyBadges(badgeType),
    enabled,
    // Screens use the badge as a nice-to-have, so a failure is not retried.
    retry: false,
  })
}
