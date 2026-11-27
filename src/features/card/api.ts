import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { ExperienceCard, ExperienceCardUpdate } from '@/shared/types/card'
import type { Page } from '@/shared/types/page'

export function getCard(cardId: number) {
  return apiClient<ExperienceCard>(`/experience-cards/${cardId}`)
}

export function useCardQuery(cardId: number | null) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.cards.mine()
  return useQuery({
    queryKey: queryKeys.cards.detail(cardId ?? 0),
    queryFn: () => getCard(cardId ?? 0),
    enabled: cardId !== null,
    retry: retryUnlessClientError,
    // Coming from the completion screen (S13) or My Page, the card is in my list already: it is
    // shown at once, as old as that list is.
    initialData: () =>
      queryClient
        .getQueryData<Page<ExperienceCard>>(listKey)
        ?.items.find((card) => card.id === cardId),
    initialDataUpdatedAt: () => queryClient.getQueryState(listKey)?.dataUpdatedAt,
  })
}

/** Only the given fields change. `memo: null` removes the memo. */
export function updateCard(cardId: number, changes: ExperienceCardUpdate) {
  return apiClient<ExperienceCard>(`/experience-cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function useUpdateCardMutation(cardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: ExperienceCardUpdate) => updateCard(cardId, changes),
    onSuccess: (card) => {
      queryClient.setQueryData(queryKeys.cards.detail(cardId), card)
      // My card list (S13, My Page) holds a copy of the card.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cards.mine() })
    },
  })
}
