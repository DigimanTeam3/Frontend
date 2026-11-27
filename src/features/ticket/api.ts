// TODO(api): provisional — no backend API for saved conditions (予約券) yet. Paths and fields are placeholders for the mock only.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Ticket, TicketListResponse } from '@/shared/types/ticket'

export function useTicketsQuery() {
  return useQuery({
    queryKey: queryKeys.tickets.list(),
    queryFn: () => apiClient<TicketListResponse>('/me/tickets'),
    retry: retryUnlessClientError,
  })
}

interface DeleteContext {
  ticket: Ticket | undefined
  index: number
}

// Removes the ticket from the list at once and puts it back at the same place if the request
// fails. Only that one ticket is restored, so another delete in flight is not undone.
export function useDeleteTicketMutation() {
  const queryClient = useQueryClient()
  const listKey = queryKeys.tickets.list()

  return useMutation<void, Error, number, DeleteContext>({
    mutationFn: (ticketId) => apiClient<void>(`/me/tickets/${ticketId}`, { method: 'DELETE' }),
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const items = queryClient.getQueryData<TicketListResponse>(listKey)?.items ?? []
      const index = items.findIndex((item) => item.id === ticketId)
      queryClient.setQueryData<TicketListResponse>(listKey, (old) =>
        old ? { items: old.items.filter((item) => item.id !== ticketId) } : old,
      )
      return { ticket: items[index], index }
    },
    onError: (_error, _ticketId, context) => {
      const { ticket, index } = context ?? { ticket: undefined, index: -1 }
      if (!ticket) return
      queryClient.setQueryData<TicketListResponse>(listKey, (old) => {
        if (!old || old.items.some((item) => item.id === ticket.id)) return old
        const items = [...old.items]
        items.splice(Math.min(index, items.length), 0, ticket)
        return { items }
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}
