import { http, HttpResponse } from 'msw/http'
import { findJourneyEvent, toEventBrief } from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/utils'
import type { EventNotification, EventNotificationListResponse } from '@/shared/types/notification'

// Alerts mock: the list (read by S17) and the LINE alert page (S18). Both need login (401 without
// it). The list has the one alert of ticket 1.
//
// Test hooks, by the notification id in the URL:
//   1     matched the condition of ticket 1 with event 4 (Korean-only texts, so lang="ko")
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   any other id → 404 NOTIFICATION_NOT_FOUND
const NETWORK_ERROR_ID = 9001
const SERVER_ERROR_ID = 9002
const MATCHED_EVENT_ID = 4
const MATCHED_TICKET_ID = 1

function matchedNotification(): EventNotification | null {
  const event = findJourneyEvent(MATCHED_EVENT_ID)
  if (!event) return null
  return {
    id: 1,
    eventId: MATCHED_EVENT_ID,
    conditionId: MATCHED_TICKET_ID,
    createdAt: '2026-11-27T18:02:00+09:00',
    condition: '週末・屋内・一人でも',
    event: toEventBrief(event),
  }
}

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()
    const notification = matchedNotification()
    const body: EventNotificationListResponse = { items: notification ? [notification] : [] }
    return HttpResponse.json(body)
  }),

  http.get('/api/notifications/:notificationId', async ({ params, request }) => {
    await mockDelay()
    const notificationId = Number(params.notificationId)
    if (notificationId === NETWORK_ERROR_ID) return HttpResponse.error()
    if (notificationId === SERVER_ERROR_ID) {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }
    if (currentUserId(request) === null) return unauthorizedResponse()

    const notification = matchedNotification()
    if (notificationId !== 1 || !notification) {
      return errorResponse(404, 'NOTIFICATION_NOT_FOUND', 'notification not found')
    }
    return HttpResponse.json(notification)
  }),
]
