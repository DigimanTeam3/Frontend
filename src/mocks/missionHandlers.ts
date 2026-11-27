import { http, HttpResponse } from 'msw/http'
import { findJourneyEvent, listMissions } from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay } from '@/mocks/mockHelpers'

// Mission list mock (S11). Shapes follow the backend API spec v0.3, in camelCase. The progress
// (isVerified, mySubmission, counts) comes from the journey state of the logged-in mock user.
//
// Test hooks, by the event id in the URL:
//   1     the four Figma missions (one has no Japanese text, one is optional and long)
//   25    indoor demo: two required missions and one optional
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   any other unknown id → 404 EVENT_NOT_FOUND; the other known events have no missions (empty)

const NETWORK_ERROR_EVENT_ID = 9001
const SERVER_ERROR_EVENT_ID = 9002

export const missionHandlers = [
  // Login is optional: without a token the answer has isVerified false and no submissions.
  http.get('/api/events/:eventId/missions', async ({ params, request }) => {
    await mockDelay()
    const eventId = Number(params.eventId)
    if (eventId === NETWORK_ERROR_EVENT_ID) return HttpResponse.error()
    if (eventId === SERVER_ERROR_EVENT_ID) {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }
    if (!findJourneyEvent(eventId)) {
      return errorResponse(404, 'EVENT_NOT_FOUND', 'event not found')
    }

    return HttpResponse.json(listMissions(eventId, currentUserId(request)))
  }),
]
