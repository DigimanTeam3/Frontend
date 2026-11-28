import { http, HttpResponse } from 'msw/http'
import { eventDetails } from '@/mocks/data/events'
import {
  findJourneyEvent,
  findParticipation,
  findParticipationById,
  INDOOR_DEMO_EVENT_ID,
  joinEvent,
  LOW_ACCURACY_EVENT_ID,
  VERIFY_ERROR_EVENT_ID,
  verifyParticipation,
} from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import { distanceMeters } from '@/shared/lib/distance'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import type { VerifyRequest, VerifyResult } from '@/shared/types/participation'

// Location check-in mock (S09). Shapes follow the backend API spec v0.3, in camelCase.
//
// Test hooks, by the event id in the URL:
//   25    indoor demo: the check-in passes from anywhere
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   9003  the event loads, but verify always answers 400 LOW_ACCURACY
//   9004  the event loads, but verify always answers 500 INTERNAL_ERROR
//   9005  the event is over: joining answers 400 EVENT_ENDED
//   any other unknown id → 404 EVENT_NOT_FOUND
// The other failures come from the data: event 1 is far away unless you stand at the venue
// (OUT_OF_RANGE), event 3 has not started (EVENT_NOT_STARTED), and checking in twice answers
// ALREADY_VERIFIED (event 5 is seeded as checked in, so it shows this one from the start).

const RADIUS_M = 300
const MAX_ACCURACY_M = 200

const NETWORK_ERROR_EVENT_ID = 9001
const SERVER_ERROR_EVENT_ID = 9002

function serverError() {
  return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
}

/** Answer forced by a test event id, or null for a normal event. */
function testHookResponse(eventId: number) {
  if (eventId === NETWORK_ERROR_EVENT_ID) return HttpResponse.error()
  if (eventId === SERVER_ERROR_EVENT_ID) return serverError()
  return null
}

function eventNotFound() {
  return errorResponse(404, 'EVENT_NOT_FOUND', 'event not found')
}

function eventPeriod(event: JourneyEvent) {
  return { startDate: event.startDate, endDate: event.endDate }
}

const hasEnded = (event: JourneyEvent) => Date.now() > Date.parse(event.endDate)
const hasNotStarted = (event: JourneyEvent) => Date.now() < Date.parse(event.startDate)

export const checkinHandlers = [
  // The event detail as the journey screens (S09–S13) read it. S05's mock data is the base for
  // the events both mocks have; this adds what the real server also sends (missionCount,
  // verificationRadius) and the journey test events (25, 9003–9006) that exist only here.
  // It is listed before the event handlers in handlers.ts, so it answers for every event id.
  http.get('/api/events/:eventId', async ({ params }) => {
    await mockDelay()
    const eventId = Number(params.eventId)
    const hooked = testHookResponse(eventId)
    if (hooked) return hooked

    const event = findJourneyEvent(eventId)
    const detail = eventDetails.find((item) => item.id === eventId)
    if (!event && !detail) return eventNotFound()
    return HttpResponse.json({ ...detail, ...event })
  }),

  // Create-or-get: 201 for a new participation, 200 for the one I already have.
  http.post('/api/events/:eventId/participation', async ({ params, request }) => {
    await mockDelay()
    const eventId = Number(params.eventId)
    const hooked = testHookResponse(eventId)
    if (hooked) return hooked
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()

    const event = findJourneyEvent(eventId)
    if (!event) return eventNotFound()
    if (hasEnded(event)) {
      return errorResponse(400, 'EVENT_ENDED', 'event has ended', { detail: eventPeriod(event) })
    }

    const { participation, created } = joinEvent(eventId, userId)
    return HttpResponse.json(participation, { status: created ? 201 : 200 })
  }),

  http.get('/api/events/:eventId/participation', async ({ params, request }) => {
    await mockDelay()
    const eventId = Number(params.eventId)
    const hooked = testHookResponse(eventId)
    if (hooked) return hooked
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()

    const participation = findParticipation(eventId, userId)
    return participation
      ? HttpResponse.json(participation)
      : errorResponse(404, 'PARTICIPATION_NOT_FOUND', 'no participation for this event')
  }),

  // The server, not the client, decides whether the position is inside the venue radius.
  http.post('/api/participations/:participationId/verify', async ({ params, request }) => {
    await mockDelay(800)
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()

    const participation = findParticipationById(Number(params.participationId))
    const event = participation && findJourneyEvent(participation.eventId)
    if (!participation || !event) {
      return errorResponse(404, 'PARTICIPATION_NOT_FOUND', 'participation not found')
    }
    if (participation.userId !== userId) {
      return errorResponse(403, 'FORBIDDEN', 'not your participation')
    }

    let body: Partial<VerifyRequest>
    try {
      body = (await request.json()) as Partial<VerifyRequest>
    } catch {
      body = {}
    }
    const { lat, lng, accuracy } = body
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return errorResponse(422, 'VALIDATION_ERROR', 'lat and lng are required', { field: 'lat' })
    }

    if (event.id === LOW_ACCURACY_EVENT_ID) {
      return errorResponse(400, 'LOW_ACCURACY', 'position is not accurate enough', {
        detail: { accuracy: accuracy ?? 850, maxAccuracy: MAX_ACCURACY_M },
      })
    }
    if (event.id === VERIFY_ERROR_EVENT_ID) return serverError()

    if (participation.status === 'verified') {
      return errorResponse(409, 'ALREADY_VERIFIED', 'already verified')
    }
    if (hasNotStarted(event)) {
      return errorResponse(400, 'EVENT_NOT_STARTED', 'event has not started', {
        detail: eventPeriod(event),
      })
    }
    if (hasEnded(event)) {
      return errorResponse(400, 'EVENT_ENDED', 'event has ended', { detail: eventPeriod(event) })
    }

    // The indoor demo has no radius or accuracy limit, so it passes inside a building too.
    const isDemo = event.id === INDOOR_DEMO_EVENT_ID
    if (!isDemo && typeof accuracy === 'number' && accuracy > MAX_ACCURACY_M) {
      return errorResponse(400, 'LOW_ACCURACY', 'position is not accurate enough', {
        detail: { accuracy, maxAccuracy: MAX_ACCURACY_M },
      })
    }
    const distanceM = distanceMeters({ lat, lng }, event)
    if (!isDemo && distanceM > RADIUS_M) {
      return errorResponse(400, 'OUT_OF_RANGE', 'outside the venue radius', {
        detail: { distanceM, radiusM: RADIUS_M },
      })
    }

    const result: VerifyResult = { ...verifyParticipation(participation, event), distanceM }
    return HttpResponse.json(result)
  }),
]
