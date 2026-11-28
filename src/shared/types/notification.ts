import type { EventBrief } from '@/shared/types/eventBrief'

/** GET /notifications/{notificationId}: a new event that matched a saved condition (予約券). */
export interface EventNotification {
  id: number
  /** ISO 8601 `+09:00`. */
  createdAt: string
  /** The saved condition that matched ("週末・屋内・一人でも"); null once that condition is deleted. */
  condition: string | null
  /** The matched event; null when the event no longer exists. */
  event: EventBrief | null
}
