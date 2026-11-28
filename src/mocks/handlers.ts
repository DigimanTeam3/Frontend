import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import { companionHandlers } from '@/mocks/companionHandlers'
import { conciergeHandlers } from '@/mocks/conciergeHandlers'
import { badgeHandlers } from '@/mocks/badgeHandlers'
import { cardHandlers } from '@/mocks/cardHandlers'
import { checkinHandlers } from '@/mocks/checkinHandlers'
import { missionHandlers } from '@/mocks/missionHandlers'
import { mypageHandlers } from '@/mocks/mypageHandlers'
import { ticketHandlers } from '@/mocks/ticketHandlers'
import { notificationHandlers } from '@/mocks/notificationHandlers'
import { uploadHandlers } from '@/mocks/uploadHandlers'
import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_EXPIRED_TOKEN,
  MOCK_GUEST_NAME,
  MOCK_TOKEN_LIFETIME_MS,
  mockUser,
} from '@/mocks/data/auth'
import { eventDetails, toEventSummary } from '@/mocks/data/events'
import type { DemoLoginRequest, LineLoginRequest, LoginResponse } from '@/shared/types/auth'
import type { ApiErrorBody, EventListResponse } from '@/shared/types/event'

// Mock-only event ids for checking error screens.
const MOCK_NETWORK_ERROR_EVENT_ID = 9001
const MOCK_SERVER_ERROR_EVENT_ID = 9002

function errorBody(code: string, message: string): ApiErrorBody {
  return { code, message }
}

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

  // Events (S02, S03, S04, S05)
  // Journey mocks (S09–S13). Kept before the event handlers: its GET /api/events/:eventId
  // answers first, with the event detail plus what the journey screens read.
  ...checkinHandlers,
  http.get('/api/events', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 20))
    const start = (page - 1) * size
    const body: EventListResponse = {
      items: eventDetails.slice(start, start + size).map(toEventSummary),
      page,
      size,
      total: eventDetails.length,
    }
    return HttpResponse.json(body)
  }),
  http.get('/api/events/:eventId', async ({ params }) => {
    await delay(400)
    const eventId = Number(params.eventId)
    if (eventId === MOCK_NETWORK_ERROR_EVENT_ID) return HttpResponse.error()
    if (eventId === MOCK_SERVER_ERROR_EVENT_ID) {
      return HttpResponse.json(errorBody('INTERNAL_ERROR', 'Mock server error'), { status: 500 })
    }
    const event = eventDetails.find((e) => e.id === eventId)
    return event
      ? HttpResponse.json(event)
      : HttpResponse.json(errorBody('EVENT_NOT_FOUND', `Event ${eventId} not found`), {
          status: 404,
        })
  }),
  ...companionHandlers,
  ...conciergeHandlers,
  ...badgeHandlers,
  ...cardHandlers,
  ...missionHandlers,
  ...mypageHandlers,
  ...notificationHandlers,
  ...ticketHandlers,
  ...uploadHandlers,
]
