import type { EventBrief } from '@/shared/types/eventBrief'

/** participation: earned by the check-in. complete: earned by finishing the required missions. */
export type BadgeType = 'participation' | 'complete'

export interface Badge {
  id: number
  eventId: number
  badgeType: BadgeType
  /** Image URL of the badge. */
  badgeImage: string
  acquiredAt: string
  event: EventBrief
}
