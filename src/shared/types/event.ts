// Event shapes shared by S02 (home), S03 (search), S04 (map) and S05 (detail).
// Matches the API proposal "[S05 - API 명세 제안] [S05] feat: event detail #15".
// `…Ja` fields are Japanese text; null means only the original (Korean) text exists.

export type EventCategory = 'festival' | 'exhibition' | 'performance'

/** Search area (issue #13): 鍾路・中区 / 麻浦・西大門 / 龍山・汝矣島 / 江南・松坡 */
export type EventArea = 'jongno-jung' | 'mapo-seodaemun' | 'yongsan-yeouido' | 'gangnam-songpa'

/** One item of GET /api/events. */
export interface EventSummary {
  id: number
  title: string
  titleJa: string | null
  category: EventCategory
  startDate: string
  endDate: string
  venueName: string
  venueNameJa: string | null
  lat: number
  lng: number
  imageUrl: string | null
  isFree: boolean
  companionCount: number
  /** Where the data comes from. Pop-up stores come as exhibitions with "popup_map_kr". */
  source?: string | null
}

/** GET /api/events/{eventId} */
export interface EventDetail extends EventSummary {
  address: string
  addressJa: string | null
  hours: string | null
  hoursJa: string | null
  fee: string | null
  feeJa: string | null
  reservationRequired: boolean
  howToJoin: string | null
  howToJoinJa: string | null
  description: string
  descriptionJa: string | null
}

/** One item of GET /api/events: the summary plus the distance from the position sent (issue #13). */
export interface EventListItem extends EventSummary {
  /** Meters from `lat`/`lng` of the request; null or left out when no position was sent. */
  distance?: number | null
}

/** GET /api/events */
export interface EventListResponse {
  items: EventListItem[]
  page: number
  size: number
  total: number
}

/** Error body for every API. */
export interface ApiErrorBody {
  code: string
  message: string
}
