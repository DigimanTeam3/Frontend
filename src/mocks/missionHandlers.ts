import { http, HttpResponse } from 'msw/http'
import {
  findJourneyEvent,
  findMission,
  findParticipation,
  findSubmission,
  listMissions,
  submitMission,
} from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'

// Mission mock (S11 list, S12 submission). Shapes follow the backend API spec v0.3, in camelCase.
// The progress (isVerified, mySubmission, counts) comes from the journey state of the logged-in
// mock user.
//
// Test hooks of the list, by the event id in the URL:
//   1     the four Figma missions (one has no Japanese text, one is optional and long)
//   25    indoor demo: two required missions and one optional
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   any other unknown id → 404 EVENT_NOT_FOUND; the other known events have no missions (empty)
//
// Test hook of the submission: a text (ひとこと) that is "!" + a code forces that answer on any
// mission, e.g. "!NOT_VERIFIED":
//   !NOT_VERIFIED  !MISSION_NOT_FOUND  !IMAGE_REQUIRED  !TEXT_REQUIRED  !INVALID_IMAGE_URL
//   !ALREADY_SUBMITTED  (also records the submission, as if it was sent from another device)
//   !INTERNAL_ERROR     (500)
//   !NETWORK            (no answer at all)

const NETWORK_ERROR_EVENT_ID = 9001
const SERVER_ERROR_EVENT_ID = 9002

const SUBMIT_ERRORS = {
  NOT_VERIFIED: { status: 403 },
  MISSION_NOT_FOUND: { status: 404 },
  ALREADY_SUBMITTED: { status: 409 },
  IMAGE_REQUIRED: { status: 422, field: 'image' },
  TEXT_REQUIRED: { status: 422, field: 'text' },
  INVALID_IMAGE_URL: { status: 422, field: 'image' },
  INTERNAL_ERROR: { status: 500 },
} as const

type SubmitErrorCode = keyof typeof SUBMIT_ERRORS

function submitError(code: SubmitErrorCode) {
  const { status, ...extra } = SUBMIT_ERRORS[code]
  return errorResponse(status, code, `mock: ${code}`, extra)
}

const FORCED_ERROR_PREFIX = '!'

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

  // A submission is approved at once. The one that finishes the last required mission of the
  // event also carries the complete badge and the experience card.
  http.post('/api/missions/:missionId/submissions', async ({ params, request }) => {
    await mockDelay(800)
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()

    const mission = findMission(Number(params.missionId))
    if (!mission) return submitError('MISSION_NOT_FOUND')

    let body: { image?: unknown; text?: unknown }
    try {
      body = (await request.json()) as typeof body
    } catch {
      body = {}
    }
    const { image } = body
    const text = typeof body.text === 'string' ? body.text.trim() : ''

    if (text.startsWith(FORCED_ERROR_PREFIX)) {
      const forced = text.slice(FORCED_ERROR_PREFIX.length)
      if (forced === 'NETWORK') return HttpResponse.error()
      if (forced === 'ALREADY_SUBMITTED') submitMission(mission, userId, {})
      if (Object.hasOwn(SUBMIT_ERRORS, forced)) return submitError(forced as SubmitErrorCode)
    }

    if (findParticipation(mission.eventId, userId)?.status !== 'verified') {
      return submitError('NOT_VERIFIED')
    }
    if (findSubmission(mission.id, userId)) return submitError('ALREADY_SUBMITTED')

    if (mission.verificationMethod === 'text') {
      if (text === '') return submitError('TEXT_REQUIRED')
      return HttpResponse.json(submitMission(mission, userId, { text }), { status: 201 })
    }
    if (image === undefined || image === null || image === '') return submitError('IMAGE_REQUIRED')
    // The upload mock hands out blob: URLs; the real server an http(s) URL.
    if (typeof image !== 'string' || !/^(blob:|http)/.test(image)) {
      return submitError('INVALID_IMAGE_URL')
    }
    const result = submitMission(mission, userId, { image, text: text === '' ? undefined : text })
    return HttpResponse.json(result, { status: 201 })
  }),
]
