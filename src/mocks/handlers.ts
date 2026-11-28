import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import { companionHandlers } from '@/mocks/companionHandlers'
import { companionTalkHandlers } from '@/mocks/companionTalkHandlers'
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
import { eventDetails, mockEventAreas, toEventSummary } from '@/mocks/data/events'
import type { DemoLoginRequest, LineLoginRequest, LoginResponse } from '@/shared/types/auth'
import type {
  ApiErrorBody,
  EventArea,
  EventCategory,
  EventListResponse,
} from '@/shared/types/event'

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

// Event list conditions (issue #12)
const EVENT_CATEGORIES: EventCategory[] = ['festival', 'exhibition', 'performance']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
// Search conditions (issue #13)
const EVENT_AREAS: EventArea[] = [
  'jongno-jung',
  'mapo-seodaemun',
  'yongsan-yeouido',
  'gangnam-songpa',
]

// Straight-line distance in meters (haversine), rounded.
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * 6_371_000 * Math.asin(Math.sqrt(h)))
}

// YYYY-MM-DD that is a real calendar day (2026-02-30 and 2026-13-40 are not).
function isCalendarDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function invalidParameter(message: string) {
  return HttpResponse.json(errorBody('INVALID_PARAMETER', message), { status: 400 })
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
    const params = url.searchParams
    const page = Math.max(1, Number(params.get('page')) || 1)
    const size = Math.min(100, Math.max(1, Number(params.get('size')) || 20))

    const category = params.get('category')
    if (category !== null && !EVENT_CATEGORIES.includes(category as EventCategory)) {
      return invalidParameter('category must be one of festival, exhibition, performance')
    }
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')
    if ([dateFrom, dateTo].some((d) => d !== null && !isCalendarDate(d))) {
      return invalidParameter('dateFrom and dateTo must be YYYY-MM-DD')
    }
    const keyword = params.get('keyword')?.trim().toLowerCase() ?? ''
    if (keyword.length > 50) return invalidParameter('keyword must be 50 characters or less')
    const area = params.get('area')
    if (area !== null && !EVENT_AREAS.includes(area as EventArea)) {
      return invalidParameter('area is not a known area')
    }
    const sort = params.get('sort') ?? 'date'
    const latText = params.get('lat')
    const lngText = params.get('lng')
    const lat = latText ? Number(latText) : null
    const lng = lngText ? Number(lngText) : null
    if (
      (latText !== null && (lat === null || !(Math.abs(lat) <= 90))) ||
      (lngText !== null && (lng === null || !(Math.abs(lng) <= 180)))
    ) {
      return invalidParameter('lat and lng must be numbers in range')
    }
    const position = lat !== null && lng !== null ? { lat, lng } : null
    if (sort !== 'date' && sort !== 'distance')
      return invalidParameter('sort must be date or distance')
    if (sort === 'distance' && !position) return invalidParameter('sort=distance needs lat and lng')

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00+09:00`) : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59+09:00`) : null
    const matched = eventDetails
      .filter((e) => !category || e.category === category)
      .filter((e) => !from || new Date(e.endDate) >= from)
      .filter((e) => !to || new Date(e.startDate) <= to)
      .filter((e) => !area || mockEventAreas[e.id] === area)
      .filter(
        (e) =>
          !keyword ||
          [e.title, e.titleJa, e.venueName, e.venueNameJa].some((text) =>
            text?.toLowerCase().includes(keyword),
          ),
      )
      .map((e) => ({
        ...toEventSummary(e),
        distance: position ? distanceMeters(position, e) : null,
      }))
      .sort((a, b) =>
        sort === 'distance'
          ? (a.distance ?? 0) - (b.distance ?? 0) || a.id - b.id
          : a.startDate.localeCompare(b.startDate) || a.id - b.id,
      )

    const start = (page - 1) * size
    const body: EventListResponse = {
      items: matched.slice(start, start + size),
      page,
      size,
      total: matched.length,
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
  ...companionTalkHandlers,
  ...conciergeHandlers,
  ...badgeHandlers,
  ...cardHandlers,
  ...missionHandlers,
  ...mypageHandlers,
  ...notificationHandlers,
  ...ticketHandlers,
  ...uploadHandlers,
]
