import { delay } from 'msw'
import { HttpResponse } from 'msw/http'

// TEMPORARY: small helpers for the mock handlers of S09–S18 and C8. C4 adds the shared
// src/mocks/utils.ts with the same names; after it is on main, import from there and delete this file.

/** Wait added to every mock answer so loading states show on screen. */
export const MOCK_DELAY_MS = 400

export function mockDelay(ms = MOCK_DELAY_MS) {
  return delay(ms)
}

/** Error answer in the shared body shape `{ code, message, field?, detail? }`. */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: { field?: string; detail?: unknown } = {},
) {
  return HttpResponse.json({ code, message, ...extra }, { status })
}

/** Token the mock (dev) login hands out, and the user it stands for. */
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
