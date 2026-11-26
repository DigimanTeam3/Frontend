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
  // Event queries carry companionCount (S05), so they are refreshed with the lists.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.companions.lists() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
  }
  return useMutation({
    mutationFn: (body: CreateCompanionBody) => createCompanion(eventId, body),
    onSuccess: (post) => {
      queryClient.setQueryData(queryKeys.companions.detail(post.id), post)
      refresh()
    },
    // Someone (another tab) already posted: refetch so the screen shows the existing post.
    onError: (error) => {
      if (apiErrorCode(error) === 'ALREADY_POSTED') refresh()
    },
  })
}

/** While someone is waiting on the other side, poll so a match shows up without reloading. */
const WAITING_POLL_MS = 10_000

export function getCompanion(postId: number) {
  return apiClient<CompanionPostDetail>(`/companions/${postId}`)
}

export function useCompanionQuery(postId: number) {
  return useQuery({
    queryKey: queryKeys.companions.detail(postId),
    queryFn: () => getCompanion(postId),
    enabled: Number.isInteger(postId) && postId > 0,
    refetchInterval: (query) => {
      const post = query.state.data
      const waiting =
        post?.status === 'OPEN' && (post.isMine || post.myRequest?.status === 'PENDING')
      return waiting ? WAITING_POLL_MS : false
    },
  })
}

export type CompanionAction =
  | { type: 'request' }
  | { type: 'cancel' }
  | { type: 'accept'; requestId: number }
  | { type: 'reject'; requestId: number }

function runCompanionAction(postId: number, action: CompanionAction) {
  switch (action.type) {
    case 'request':
      return apiClient<CompanionPostDetail>(`/companions/${postId}/requests`, { method: 'POST' })
    case 'cancel':
      return apiClient<CompanionPostDetail>(`/companions/${postId}/requests/me`, {
        method: 'DELETE',
      })
    case 'accept':
    case 'reject':
      return apiClient<CompanionPostDetail>(
        `/companions/${postId}/requests/${action.requestId}/${action.type}`,
        { method: 'POST' },
      )
  }
}

/** Request, cancel, accept and reject all answer with the updated post. */
export function useCompanionActionMutation(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: CompanionAction) => runCompanionAction(postId, action),
    // Stop an in-flight 10s poll so its older answer cannot overwrite the result below.
    onMutate: () => queryClient.cancelQueries({ queryKey: queryKeys.companions.detail(postId) }),
    onSuccess: (post) => {
      queryClient.setQueryData(queryKeys.companions.detail(postId), post)
      return queryClient.invalidateQueries({ queryKey: queryKeys.companions.lists() })
    },
    // A 409 means the post changed meanwhile (full, cancelled ...): show the latest state.
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.companions.detail(postId) }),
  })
}
