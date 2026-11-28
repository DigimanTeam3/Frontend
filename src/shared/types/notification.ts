import type { EventBrief } from '@/shared/types/eventBrief'

// TODO(api): provisional — no backend API for notifications yet (LINE alert for saved conditions). Path and fields are placeholders for the mock only.

/** GET /notifications/{notificationId}: a new event that matched a saved condition (予約券). */
export interface EventNotification {
  id: number
  /** ISO 8601 `+09:00`. */
  createdAt: string
  /** The saved condition text that matched, e.g. "週末・屋内・一人でも". */
  condition: string
  event: EventBrief
}
