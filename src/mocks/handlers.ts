import { http, HttpResponse } from 'msw/http'
import { badgeHandlers } from '@/mocks/badgeHandlers'
import { cardHandlers } from '@/mocks/cardHandlers'
import { checkinHandlers } from '@/mocks/checkinHandlers'
import { events } from '@/mocks/data/events'
import { missionHandlers } from '@/mocks/missionHandlers'
import { uploadHandlers } from '@/mocks/uploadHandlers'

// Paths follow the endpoint list in the service plan (8.10), under the /api prefix.
export const handlers = [
  // First: its TEMP /api/events/:eventId answers before the old one below.
  ...checkinHandlers,
  http.get('/api/events', () => HttpResponse.json(events)),
  http.get('/api/events/:eventId', ({ params }) => {
    const event = events.find((e) => e.id === Number(params.eventId))
    return event ? HttpResponse.json(event) : new HttpResponse(null, { status: 404 })
  }),
  ...badgeHandlers,
  ...cardHandlers,
  ...missionHandlers,
  ...uploadHandlers,
]
