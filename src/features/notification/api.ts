// GET /notifications/{id}: the alert a LINE message links to (a new event matched a saved
// condition). 404 NOTIFICATION_NOT_FOUND for an unknown id, 403 for someone else's.
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
