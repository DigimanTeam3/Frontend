import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { retryUnlessClientError } from '@/shared/api/journey'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Ticket, TicketListResponse } from '@/shared/types/ticket'

export function useTicketsQuery() {
  return useQuery({
    queryKey: queryKeys.tickets.list(),
    queryFn: () => apiClient<TicketListResponse>('/saved-conditions'),
    retry: retryUnlessClientError,
  })
}

// Names the deletes, to count the ones still running (not a cache key, so it is kept here).
const DELETE_TICKET_MUTATION_KEY = ['tickets', 'delete'] as const

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
    mutationKey: DELETE_TICKET_MUTATION_KEY,
    mutationFn: (ticketId) =>
      apiClient<void>(`/saved-conditions/${ticketId}`, { method: 'DELETE' }),
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
    onSettled: () => {
      // Only the last delete still running reloads the list (this one counts as running here):
      // a reload in between would bring back a ticket whose delete has not reached the server.
      if (queryClient.isMutating({ mutationKey: DELETE_TICKET_MUTATION_KEY }) !== 1) return
      // Not returned: the delete is over now, its result must not wait for the reload.
      void queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
