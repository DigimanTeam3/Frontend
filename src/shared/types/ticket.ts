// Saved conditions (予約券): GET /saved-conditions answers `{ items }`, POST /saved-conditions answers
// the new one (201), DELETE /saved-conditions/{id} answers 204.

/** A search condition the user saved from the AI concierge (S16), shown as a 予約券 (S17). */
export interface Ticket {
  id: number
  /** The saved condition as one line of text, e.g. "週末・屋内・一人でも". */
  condition: string
  /** The parts of the condition (date, area, category ...) as short labels. May be empty. */
  labels: string[]
  /** ISO 8601 `+09:00`. */
  createdAt: string
  /** True once a new event matched this condition. */
  matched: boolean
}

/** GET /saved-conditions */
export interface TicketListResponse {
  items: Ticket[]
}

export type TicketArea = 'jongno-jung' | 'mapo-seodaemun' | 'yongsan-yeouido' | 'gangnam-songpa'
export type TicketCategory = 'festival' | 'exhibition' | 'performance'

/**
 * POST /saved-conditions. Every field is optional on the server; this app always sends them all.
 * The answer is the new `Ticket`: `condition` is `labelJa`, `labels` are built by the server from
 * the other fields.
 */
export interface TicketCreateRequest {
  /** The condition as one line of text (at most 120 characters). Shown as `Ticket.condition`. */
  labelJa: string
  /** YYYY-MM-DD. */
  dateFrom: string | null
  /** YYYY-MM-DD. */
  dateTo: string | null
  area: TicketArea | null
  category: TicketCategory | null
  companion: 'alone' | 'together' | null
  /** At most 10, each 1–50 characters. */
  keywords: string[]
  /** True: a LINE message is sent when a new event matches. */
  notifyLine: boolean
}
