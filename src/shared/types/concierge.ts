// S16 AI concierge shapes. Matches the API proposal
// "[S16 - API 명세 제안] [S16] feat: ai concierge #26" (issue #26 body).

export type ConciergeEventCategory = 'festival' | 'exhibition' | 'performance'

/**
 * Same fields as `EventSummary` in the S05 proposal (#15).
 * Replace with that type once S05 (src/shared/types/event.ts) is merged.
 */
export interface ConciergeEventSummary {
  id: number
  title: string
  titleJa: string | null
  category: ConciergeEventCategory
  startDate: string
  endDate: string
  venueName: string
  venueNameJa: string | null
  lat: number
  lng: number
  imageUrl: string | null
  isFree: boolean
  companionCount: number
}

/** Search conditions the concierge used for a reply. Sent back with the next question. */
export interface ConciergeConditions {
  dateFrom: string | null
  dateTo: string | null
  area: string | null
  category: ConciergeEventCategory | null
  companion: 'alone' | 'group' | null
  keywords: string[]
}

export interface ConciergeHistoryItem {
  role: 'user' | 'assistant'
  text: string
}

/** POST /api/concierge/messages request body */
export interface ConciergeMessageRequest {
  text: string
  history: ConciergeHistoryItem[]
  conditions: ConciergeConditions | null
}

export type ConciergeReplyKind = 'answer' | 'clarify' | 'notFound'

export interface ConciergeRecommendation {
  event: ConciergeEventSummary
  reason: string
}

/** POST /api/concierge/messages response */
export interface ConciergeReply {
  kind: ConciergeReplyKind
  reply: string
  recommendations: ConciergeRecommendation[]
  suggestions: string[]
  conditions: ConciergeConditions
}

/** POST /api/concierge/transcribe response */
export interface ConciergeTranscription {
  text: string
}
