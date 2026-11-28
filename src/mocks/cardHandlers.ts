import { http, HttpResponse } from 'msw/http'
import { findCard, listCards, updateCard } from '@/mocks/data/journey'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import type { ExperienceCard, ExperienceCardUpdate } from '@/shared/types/card'
import type { Page } from '@/shared/types/page'

// Experience card mock (S13 completion, S14 card detail, My Page). Shapes follow the backend API
// spec v0.3, in camelCase. The cards come from the journey state: submitting the last required
// mission of an event (S12) creates the card, so there is none before that.
//
// Test hooks, by the card id in the URL (GET and PATCH /experience-cards/:cardId):
//   9001  network error (no answer at all)
//   9002  500 INTERNAL_ERROR
//   any other unknown id → 404 CARD_NOT_FOUND
// PATCH: a memo longer than 500 characters answers 422 VALIDATION_ERROR with field "memo"; a
// null memo removes it. A memo that is "!" + a code forces that answer on any card:
//   !VALIDATION_ERROR  (422)   !INTERNAL_ERROR  (500)   !NETWORK  (no answer at all)
// The list (GET /me/experience-cards) has no id; S13 shows its error states through the event
// ids 9001 / 9002 of GET /events/:eventId (see checkinHandlers.ts).

const NETWORK_ERROR_CARD_ID = 9001
const SERVER_ERROR_CARD_ID = 9002

const DEFAULT_PAGE_SIZE = 20
const MEMO_MAX_LENGTH = 500

const FORCED_VALIDATION_MEMO = '!VALIDATION_ERROR'
const FORCED_SERVER_ERROR_MEMO = '!INTERNAL_ERROR'
const FORCED_NETWORK_MEMO = '!NETWORK'

function parsePositiveInt(value: string | null, fallback: number) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

/** Answer forced by a test card id, or null for a normal card. */
function testHookResponse(cardId: number) {
  if (cardId === NETWORK_ERROR_CARD_ID) return HttpResponse.error()
  if (cardId === SERVER_ERROR_CARD_ID) {
    return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
  }
  return null
}

function cardNotFound() {
  return errorResponse(404, 'CARD_NOT_FOUND', 'card not found')
}

export const cardHandlers = [
  http.get('/api/me/experience-cards', async ({ request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()

    const url = new URL(request.url)
    const page = parsePositiveInt(url.searchParams.get('page'), 1)
    const size = parsePositiveInt(url.searchParams.get('size'), DEFAULT_PAGE_SIZE)

    const all = listCards()
    const body: Page<ExperienceCard> = {
      items: all.slice((page - 1) * size, page * size),
      total: all.length,
      page,
      size,
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/experience-cards/:cardId', async ({ params, request }) => {
    await mockDelay()
    const cardId = Number(params.cardId)
    const hooked = testHookResponse(cardId)
    if (hooked) return hooked
    if (currentUserId(request) === null) return unauthorizedResponse()

    const card = findCard(cardId)
    return card ? HttpResponse.json(card) : cardNotFound()
  }),

  http.patch('/api/experience-cards/:cardId', async ({ params, request }) => {
    await mockDelay()
    const cardId = Number(params.cardId)
    const hooked = testHookResponse(cardId)
    if (hooked) return hooked
    if (currentUserId(request) === null) return unauthorizedResponse()

    const card = findCard(cardId)
    if (!card) return cardNotFound()

    let body: { memo?: unknown; userImage?: unknown }
    try {
      body = (await request.json()) as typeof body
    } catch {
      body = {}
    }
    const changes: ExperienceCardUpdate = {}
    if (body.memo === null) {
      changes.memo = null
    } else if (body.memo !== undefined) {
      if (body.memo === FORCED_NETWORK_MEMO) return HttpResponse.error()
      if (body.memo === FORCED_SERVER_ERROR_MEMO) {
        return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
      }
      if (
        typeof body.memo !== 'string' ||
        body.memo.length > MEMO_MAX_LENGTH ||
        body.memo === FORCED_VALIDATION_MEMO
      ) {
        return errorResponse(422, 'VALIDATION_ERROR', 'memo must be 500 characters or less', {
          field: 'memo',
        })
      }
      changes.memo = body.memo
    }
    if (body.userImage !== undefined) {
      if (typeof body.userImage !== 'string' || body.userImage === '') {
        return errorResponse(422, 'VALIDATION_ERROR', 'userImage must be an image URL', {
          field: 'userImage',
        })
      }
      changes.userImage = body.userImage
    }
    return HttpResponse.json(updateCard(card, changes))
  }),
]
