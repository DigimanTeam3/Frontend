import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import { conciergeHandlers } from '@/mocks/conciergeHandlers'
import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_EXPIRED_TOKEN,
  MOCK_GUEST_NAME,
  MOCK_TOKEN_LIFETIME_MS,
  mockUser,
} from '@/mocks/data/auth'
import { events } from '@/mocks/data/events'
import type { DemoLoginRequest, LineLoginRequest, LoginResponse } from '@/shared/types/auth'

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/** ISO 8601 in Japan time, e.g. "2026-11-29T10:00:00+09:00" (the API rule for times). */
function toJstIso(date: Date) {
  return `${new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 19)}+09:00`
}

// Paths follow the endpoint list in the service plan (8.10), under the /api prefix.
export const handlers = [
  // S01: any API called with the expired mock token answers 401. Keep this first.
  http.all('/api/*', ({ request }) => {
    if (request.headers.get('Authorization') === `Bearer ${MOCK_EXPIRED_TOKEN}`) {
      return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'token expired' }, { status: 401 })
    }
    return undefined // fall through to the next handler
  }),
  // S01: LINE login (code -> app token)
  http.post('/api/auth/line', async ({ request }) => {
    await delay(600)
    const body = (await request.json().catch(() => null)) as Partial<LineLoginRequest> | null
    if (!body?.code || !body.redirectUri || !body.codeVerifier || !body.nonce) {
      return HttpResponse.json(
        { code: 'INVALID_REQUEST', message: 'missing field' },
        { status: 400 },
      )
    }
    // Any other code (for example "mock-fail") is rejected.
    if (body.code !== MOCK_AUTH_CODE) {
      return HttpResponse.json(
        { code: 'LINE_AUTH_FAILED', message: 'authorization code is invalid or expired' },
        { status: 401 },
      )
    }
    const response: LoginResponse = {
      accessToken: MOCK_ACCESS_TOKEN,
      expiresAt: toJstIso(new Date(Date.now() + MOCK_TOKEN_LIFETIME_MS)),
      user: mockUser,
    }
    return HttpResponse.json(response)
  }),
  // S01: guest (demo) login. The body is optional.
  http.post('/api/auth/demo-login', async ({ request }) => {
    await delay(600)
    const body = (await request.json().catch(() => null)) as DemoLoginRequest | null
    const response: LoginResponse = {
      accessToken: MOCK_ACCESS_TOKEN,
      expiresAt: toJstIso(new Date(Date.now() + MOCK_TOKEN_LIFETIME_MS)),
      user: { id: 2, displayName: body?.displayName || MOCK_GUEST_NAME, pictureUrl: null },
    }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.get('/api/events', () => HttpResponse.json(events)),
  http.get('/api/events/:eventId', ({ params }) => {
    const event = events.find((e) => e.id === Number(params.eventId))
    return event ? HttpResponse.json(event) : new HttpResponse(null, { status: 404 })
  }),
  ...conciergeHandlers,
]
