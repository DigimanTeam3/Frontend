import { ApiError } from '@/shared/api/client'

// TEMPORARY: reads the error body until the shared helpers of C4 (src/shared/api/errors.ts:
// apiErrorCode, isApiError) are on main. After that, import those instead and delete this file.
// It parses `error.message` (the raw response body), which stays the same after C4.

/** Error body of every API: `{ "code": "OUT_OF_RANGE", "message": "...", "field"?: "..." }`. */
export interface ApiErrorInfo {
  /** Fixed name the screen picks its copy by. The server `message` is never shown. */
  code: string
  /** Input field a validation error points at. */
  field?: string
  /** Extra values some errors carry, e.g. `{ distanceM, radiusM }` for OUT_OF_RANGE. */
  detail?: unknown
}

export function apiErrorInfo(error: unknown): ApiErrorInfo | null {
  if (!(error instanceof ApiError)) return null
  let body: unknown
  try {
    body = JSON.parse(error.message)
  } catch {
    return null
  }
  if (!body || typeof body !== 'object') return null
  const { code, field, detail } = body as Record<string, unknown>
  if (typeof code !== 'string' || code === '') return null
  return {
    code,
    ...(typeof field === 'string' ? { field } : {}),
    ...(detail !== undefined && detail !== null ? { detail } : {}),
  }
}

/** `code` of an API error, or null (network error, other errors, body without a code). */
export function apiErrorCode(error: unknown): string | null {
  return apiErrorInfo(error)?.code ?? null
}

/** HTTP status of an API error, or null when the server was not reached. */
export function apiErrorStatus(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null
}

/** True when the request never got an answer (offline, DNS, CORS): fetch rejects with a TypeError. */
export function isNetworkError(error: unknown) {
  return error instanceof TypeError
}
