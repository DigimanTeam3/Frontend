import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type {
  CompanionComment,
  CompanionCommentListResponse,
  CompanionMessage,
  CompanionMessageListResponse,
} from '@/shared/types/companionChat'

// Comments and chat on a companion post (S08). API proposal: issue #83.

export const COMMENT_MAX_LENGTH = 200
export const MESSAGE_MAX_LENGTH = 500
export const COMMENT_PAGE_SIZE = 20
/** Most the server sends at once (size ≤ 100). */
export const MESSAGE_PAGE_SIZE = 100

/** Counts characters the way people see them (emoji and kana count as one). */
export function textLength(text: string) {
  return Array.from(text.trim()).length
}

export function getComments(postId: number, page: number) {
  const params = new URLSearchParams({ page: String(page), size: String(COMMENT_PAGE_SIZE) })
  return apiClient<CompanionCommentListResponse>(`/companions/${postId}/comments?${params}`)
}

export function useCommentsQuery(postId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.companions.comments(postId),
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    enabled: Number.isInteger(postId) && postId > 0,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.size < last.total ? last.page + 1 : undefined),
  })
}

export function createComment(postId: number, content: string) {
  return apiClient<CompanionComment>(`/companions/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: content.trim() }),
  })
}

export function deleteComment(postId: number, commentId: number) {
  return apiClient<void>(`/companions/${postId}/comments/${commentId}`, { method: 'DELETE' })
}

/** Writing or deleting reloads the loaded pages, so page boundaries and the total stay right. */
export function useCommentMutations(postId: number) {
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.companions.comments(postId) })
  const create = useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId),
    // Also after an error: a 404 means it is already gone, a 403 that the list is out of date.
    onSettled: refresh,
  })
  return { create, remove }
}

export function getMessages(postId: number, afterId: number) {
  const params = new URLSearchParams({ afterId: String(afterId), size: String(MESSAGE_PAGE_SIZE) })
  return apiClient<CompanionMessageListResponse>(`/companions/${postId}/messages?${params}`)
}

export function sendMessage(postId: number, content: string) {
  return apiClient<CompanionMessage>(`/companions/${postId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content: content.trim() }),
  })
}
