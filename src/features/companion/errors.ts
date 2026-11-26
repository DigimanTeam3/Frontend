import { ApiError } from '@/shared/api/client'

export interface ApiErrorBody {
  code: string
  /** Input field the error is about (validation errors only). */
  field?: string
}

/** Reads an API error body like `{ "code": "EVENT_NOT_FOUND", "field": "intro" }`. */
export function apiErrorBody(error: unknown): ApiErrorBody | null {
  if (!(error instanceof ApiError)) return null
  try {
    const body: unknown = JSON.parse(error.message)
    if (body && typeof body === 'object' && 'code' in body && typeof body.code === 'string') {
      const field = 'field' in body && typeof body.field === 'string' ? body.field : undefined
      return { code: body.code, field }
    }
  } catch {
    // Body was not JSON.
  }
  return null
}

export function apiErrorCode(error: unknown): string | null {
  return apiErrorBody(error)?.code ?? null
}
