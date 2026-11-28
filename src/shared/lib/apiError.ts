import { apiErrorCode, isApiError } from '@/shared/api/errors'

// What the shared helpers (src/shared/api/errors.ts) do not have. Codes, fields, status and
// detail are read with apiErrorCode, apiErrorField, isApiError and error.body from there.

/** True when the server was not reached at all (offline, DNS, CORS): fetch throws a TypeError. */
export function isNetworkError(error: unknown) {
  return error instanceof TypeError
}

/** 404 EVENT_NOT_FOUND; a 404 without a readable body counts too. */
export function isEventNotFound(error: unknown) {
  const code = apiErrorCode(error)
  return code === 'EVENT_NOT_FOUND' || (code === null && isApiError(error, 404))
}
