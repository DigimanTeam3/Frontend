import { delay, http, HttpResponse } from 'msw'
import { eventDetails, toEventSummary } from '@/mocks/data/events'
import type { ApiErrorBody, EventListResponse } from '@/shared/types/event'

// Mock-only event ids for checking error screens.
const MOCK_NETWORK_ERROR_EVENT_ID = 9001
const MOCK_SERVER_ERROR_EVENT_ID = 9002

function errorBody(code: string, message: string): ApiErrorBody {
  return { code, message }
}

// Paths follow the endpoint list in the service plan (8.10), under the /api prefix.
export const handlers = [
  // Events (S02, S03, S04, S05)
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
]
