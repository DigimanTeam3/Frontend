import type { EventBrief } from '@/shared/types/eventBrief'

/**
 * A new event that matched a saved condition (予約券). GET /notifications/{notificationId} answers
 * one, GET /notifications answers all of mine as `{ items }`, newest first.
 */
export interface EventNotification {
  id: number
  eventId: number
  /** The saved condition (`Ticket.id`) that matched; null once that condition is deleted. */
  conditionId: number | null
  /** ISO 8601 `+09:00`. */
  createdAt: string
  /** The saved condition that matched ("週末・屋内・一人でも"); null once that condition is deleted. */
  condition: string | null
  /** The matched event; null when the event no longer exists. */
  event: EventBrief | null
}

/** GET /notifications */
export interface EventNotificationListResponse {
  items: EventNotification[]
}
