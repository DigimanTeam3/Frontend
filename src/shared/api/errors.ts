import type { ApiErrorBody } from '@/shared/types/api'

/** Reads `{ code, message, field?, detail? }` from an error response. null when the body is not that JSON. */
export function parseErrorBody(text: string): ApiErrorBody | null {
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  if (!body || typeof body !== 'object') return null
  const { code, message, field, detail } = body as Record<string, unknown>
  if (typeof code !== 'string' || code === '') return null
  return {
    code,
    message: typeof message === 'string' ? message : '',
    ...(typeof field === 'string' ? { field } : {}),
    ...(detail !== undefined ? { detail } : {}),
  }
}

/**
 * Seconds to wait from a `Retry-After` header (429 RATE_LIMITED sends "60"), or null.
 * An HTTP date is turned into seconds from now.
 */
export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds : null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : Math.max(0, Math.ceil((time - Date.now()) / 1000))
}

/** Thrown by apiClient for every non-2xx response. Network failures stay as fetch's TypeError. */
export class ApiError extends Error {
  readonly status: number
  /** `code` of the error body, e.g. "EVENT_NOT_FOUND". null when the body was not the usual JSON. */
  readonly code: string | null
  /** Parsed error body. null when the body was not `{ code, message }` JSON. */
  readonly body: ApiErrorBody | null
  /** Seconds from the Retry-After header (e.g. 429), or null. */
  readonly retryAfter: number | null

  /** `responseText` is the raw body. It is kept as `message`, so code that parses it still works. */
  constructor(status: number, responseText: string, retryAfter: number | null = null) {
    super(responseText)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
    this.body = parseErrorBody(responseText)
    this.code = this.body?.code ?? null
  }
}

/**
 * True for an ApiError, optionally only for one status or one code:
 * `isApiError(error)`, `isApiError(error, 404)`, `isApiError(error, 'EVENT_NOT_FOUND')`.
 * Pass a status as a number: a string is always read as a code, so `'404'` never matches.
 */
export function isApiError(error: unknown, match?: number | string): error is ApiError {
  if (!(error instanceof ApiError)) return false
  if (match === undefined) return true
  return typeof match === 'number' ? error.status === match : error.code === match
}

/** `code` of an API error, or null (network error, other errors, body without a code). */
export function apiErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

/** Input field a validation error points at (`field` of the body), or null. */
export function apiErrorField(error: unknown): string | null {
  return error instanceof ApiError ? (error.body?.field ?? null) : null
}

/**
 * Default retry for queries: retry once after a network or server (5xx) error.
 * 4xx answers (not found, login needed, bad input) do not change on a retry, so they show at once.
 * This includes 408 and 429: the screen's retry button covers them.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 1
}
