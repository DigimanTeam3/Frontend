import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { ExperienceCard } from '@/shared/types/card'
import type { Page } from '@/shared/types/page'

// My experience cards. In shared/ because the card screens (S13) and My Page both read them.

// Page size that holds every card for now.
const CARD_PAGE_SIZE = 100

// TODO(api): there is no "card of one event" endpoint, so the completion screen (S13) loads the
// first page and looks for the event there.
export function getMyCards() {
  const query = new URLSearchParams({ page: '1', size: String(CARD_PAGE_SIZE) })
  return apiClient<Page<ExperienceCard>>(`/me/experience-cards?${query}`)
}

export function useMyCardsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cards.mine(),
    queryFn: getMyCards,
    enabled,
    retry: retryUnlessClientError,
  })
}
