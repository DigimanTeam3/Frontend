import { http, HttpResponse } from 'msw/http'
import { companionHandlers } from '@/mocks/companionHandlers'
import { events } from '@/mocks/data/events'

// Paths follow the endpoint list in the service plan (8.10), under the /api prefix.
export const handlers = [
  http.get('/api/events', () => HttpResponse.json(events)),
  http.get('/api/events/:eventId', ({ params }) => {
    const event = events.find((e) => e.id === Number(params.eventId))
    return event ? HttpResponse.json(event) : new HttpResponse(null, { status: 404 })
  }),
  ...companionHandlers,
]
