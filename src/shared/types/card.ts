import type { Badge } from '@/shared/types/badge'
import type { EventBrief } from '@/shared/types/eventBrief'
import type { StickerPlacement } from '@/shared/lib/stickers'

/** The polaroid card made when the last required mission of an event is submitted. */
export interface ExperienceCard {
  id: number
  eventId: number
  /** The event of the card; null when the event no longer exists (the titles below stay). */
  event: EventBrief | null
  eventTitle?: string | null
  eventTitleJa?: string | null
  /** Day of the check-in as ISO 8601 in Seoul time ("2026-11-26T00:00:00+09:00"), or null. */
  eventDate: string | null
  /** Original (Korean) venue name. */
  venue: string
  /** Japanese venue name; null means only the original text exists. */
  venueJa: string | null
  eventImage: string | null
  /** My own photo on the card; null until I add one. */
  userImage: string | null
  /** Empty text means there is no memo. */
  memo: string
  participationBadge: Badge | null
  completeBadge: Badge | null
  /**
   * Where the badge stickers sit on the card, as saved on the completion screen (S13). Null when
   * they were never saved; an empty list when every sticker was taken off.
   */
  stickerPlacements?: StickerPlacement[] | null
  createdAt: string
}

/** Body of PATCH /experience-cards/{cardId}: only the given fields change. */
export interface ExperienceCardUpdate {
  /** Up to 500 characters. An empty text removes the memo (the server refuses null). */
  memo?: string
  userImage?: string
  /** One per badge, x and y from -0.5 to 1.5. Null removes the saved arrangement. */
  stickerPlacements?: StickerPlacement[] | null
}
