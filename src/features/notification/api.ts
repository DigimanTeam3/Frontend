// TODO(api): provisional — no backend API for notifications yet (LINE alert for saved conditions). Path and fields are placeholders for the mock only.
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import type { EventNotification } from '@/shared/types/notification'

export function useNotificationQuery(notificationId: number | null) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(notificationId ?? 0),
    queryFn: () => apiClient<EventNotification>(`/notifications/${notificationId}`),
    enabled: notificationId !== null,
  })
}
