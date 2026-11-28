// TODO(api): provisional — no backend API for notifications yet (LINE alert for saved conditions). Path and fields are placeholders for the mock only.
import { http, HttpResponse } from 'msw/http'
import { findJourneyEvent, toEventBrief } from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import type { EventNotification } from '@/shared/types/notification'

// LINE alert page mock (S18). Needs login (401 without it).
//
// Test hooks, by the notification id in the URL:
//   1     matched the condition of ticket 1 with event 4 (Korean-only texts, so lang="ko")
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   any other id → 404 NOTIFICATION_NOT_FOUND
const NETWORK_ERROR_ID = 9001
const SERVER_ERROR_ID = 9002
const MATCHED_EVENT_ID = 4

export const notificationHandlers = [
  http.get('/api/notifications/:notificationId', async ({ params, request }) => {
    await mockDelay()
    const notificationId = Number(params.notificationId)
    if (notificationId === NETWORK_ERROR_ID) return HttpResponse.error()
    if (notificationId === SERVER_ERROR_ID) {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }
    if (currentUserId(request) === null) return unauthorizedResponse()

    const event = findJourneyEvent(MATCHED_EVENT_ID)
    if (notificationId !== 1 || !event) {
      return errorResponse(404, 'NOTIFICATION_NOT_FOUND', 'notification not found')
    }
    const body: EventNotification = {
      id: 1,
      createdAt: '2026-11-27T18:02:00+09:00',
      condition: '週末・屋内・一人でも',
      event: toEventBrief(event),
    }
    return HttpResponse.json(body)
  }),
]
