// GET /notifications: every alert of mine (a new event matched a saved condition), newest first.
// Shared: the tickets screen (S17) reads it to link an arrived ticket to its alert page (S18).
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventNotificationListResponse } from '@/shared/types/notification'

export function useNotificationsQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient<EventNotificationListResponse>('/notifications'),
    enabled,
  })
}
