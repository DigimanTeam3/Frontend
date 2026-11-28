import type { Badge } from '@/shared/types/badge'
import type { EventBrief } from '@/shared/types/eventBrief'

/** The polaroid card made when the last required mission of an event is submitted. */
export interface ExperienceCard {
  id: number
  event: EventBrief
  /** Day of the check-in, "YYYY-MM-DD" (Seoul time). */
  eventDate: string
  /** Original (Korean) venue name. */
  venue: string
  /** Japanese venue name; null means only the original text exists. */
  venueJa: string | null
  eventImage: string | null
  /** My own photo on the card; null until I add one. */
  userImage: string | null
  memo: string | null
  participationBadge: Badge
  completeBadge: Badge
  createdAt: string
}
