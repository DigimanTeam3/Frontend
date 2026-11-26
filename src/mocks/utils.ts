import { delay, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/shared/types/api'

// Shared helpers for MSW handlers. Rules: docs/api/README.md ("mock").

/** Wait added to every mock answer so loading states show on screen. */
export const MOCK_DELAY_MS = 400

export function mockDelay(ms = MOCK_DELAY_MS) {
  return delay(ms)
}

/** Error answer in the shared body shape `{ code, message, field? }`. */
export function errorResponse(status: number, code: string, message: string, field?: string) {
  const body: ApiErrorBody = field === undefined ? { code, message } : { code, message, field }
  return HttpResponse.json(body, { status })
}

/** Path ids that answer with an error in mock mode, e.g. `/events/9002` → 500. */
export const MOCK_ERROR_ID = {
  network: 9001,
  server: 9002,
} as const

/** Error answer for a reserved id (network error or 500), or undefined for a normal id. */
export function mockErrorFor(id: number) {
  if (id === MOCK_ERROR_ID.network) return HttpResponse.error()
  if (id === MOCK_ERROR_ID.server) return errorResponse(500, 'INTERNAL_ERROR', 'Mock server error')
  return undefined
}

/** Token the mock login hands out, and the user it stands for. */
export const MOCK_ACCESS_TOKEN = 'mock-access-token'
export const MOCK_USER_ID = 1

/** Logged-in user of a mock request, or null when the request has no valid mock token. */
export function currentUserId(request: Request): number | null {
  return request.headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
    ? MOCK_USER_ID
    : null
}

/** 401 answer for APIs that need login. */
export function unauthorizedResponse() {
  return errorResponse(401, 'UNAUTHORIZED', 'login required')
}
