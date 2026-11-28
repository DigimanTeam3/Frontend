// Shapes shared by every API. Screen-specific shapes live in their own files (event.ts, …).

/** Error body of every API, e.g. `{ "code": "EVENT_NOT_FOUND", "message": "Event 999 not found" }`. */
export interface ApiErrorBody {
  /** Fixed error name the screen branches on (UPPER_SNAKE_CASE). */
  code: string
  /** Short English note for logs. Screens show copy from ja.ts, not this. */
  message: string
  /** Input field the error is about (validation errors only). */
  field?: string
  /** Extra data for some codes, e.g. OUT_OF_RANGE `{ distanceMeters, radiusMeters }`. */
  detail?: unknown
}
