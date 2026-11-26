import { ApiError } from '@/shared/api/client'

/** Reads `code` from an API error body like `{ "code": "EVENT_NOT_FOUND", ... }`. */
export function apiErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  try {
    const body: unknown = JSON.parse(error.message)
    if (body && typeof body === 'object' && 'code' in body && typeof body.code === 'string') {
      return body.code
    }
  } catch {
    // Body was not JSON.
  }
  return null
}
