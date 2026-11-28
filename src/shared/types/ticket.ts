// Saved conditions (予約券): GET /saved-conditions answers `{ items }`, DELETE /saved-conditions/{id} answers 204.

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
