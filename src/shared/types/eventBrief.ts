/** Event fields embedded in badges, cards and participations (subset of EventSummary, issue #15). */
export interface EventBrief {
  id: number
  title: string
  /** Japanese title; null means only the original (Korean) text exists. */
  titleJa: string | null
  venueName: string
  venueNameJa: string | null
  imageUrl: string | null
  startDate: string
  endDate: string
}

export type JourneyEventCategory = 'festival' | 'exhibition' | 'performance'

// TEMP: the fields of GET /events/{eventId} (EventDetail, issue #15) that the journey screens
// (S09–S14) read. Use EventDetail instead once src/shared/types/event.ts has it on main.
export interface JourneyEvent extends EventBrief {
  category: JourneyEventCategory
  lat: number
  lng: number
}
