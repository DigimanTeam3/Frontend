import { http, HttpResponse } from 'msw/http'
import { hasContactInfo } from '@/features/companion/validation'
import {
  MOCK_ME_ID,
  acceptRequest,
  posts,
  requests,
  runAutoAccept,
  statusOf,
  toDetail,
  toEventSummary,
  toSummary,
} from '@/mocks/data/companions'
import { errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/utils'
import type { CompanionStatus, CreateCompanionBody } from '@/shared/types/companion'

// Companion API mocks (S06–S08). Shapes follow the API proposals in GitHub issues (S06 #16).

const MOCK_TOKEN = 'Bearer mock-access-token'
const STATUS_ORDER: Record<CompanionStatus, number> = { OPEN: 0, FULL: 1, CLOSED: 2 }

function currentUserId(request: Request): number | null {
  return request.headers.get('Authorization') === MOCK_TOKEN ? MOCK_ME_ID : null
}

const postNotFound = () => errorResponse(404, 'COMPANION_NOT_FOUND', 'post not found')

function findPost(postId: unknown) {
  return posts.find((post) => post.id === Number(postId))
}

let nextPostId = 200
let nextRequestId = 600

// Same rules as the S07 proposal, so the screen's server-error path can be tried in mock mode.
function validateBody(body: Partial<CreateCompanionBody>, endDate: string) {
  const meetAt = typeof body.meetAt === 'string' ? new Date(body.meetAt) : null
  if (!meetAt || Number.isNaN(meetAt.getTime()) || meetAt.getTime() <= Date.now()) {
    return errorResponse(400, 'VALIDATION_ERROR', 'meetAt is invalid', 'meetAt')
  }
  if (meetAt.getTime() > new Date(endDate).getTime()) {
    return errorResponse(400, 'VALIDATION_ERROR', 'meetAt is after the event', 'meetAt')
  }
  if (!Number.isInteger(body.capacity) || body.capacity! < 2 || body.capacity! > 4) {
    return errorResponse(400, 'VALIDATION_ERROR', 'capacity must be 2-4', 'capacity')
  }
  const intro = typeof body.intro === 'string' ? body.intro.trim() : ''
  if (!intro || Array.from(intro).length > 60 || intro.includes('\n')) {
    return errorResponse(400, 'VALIDATION_ERROR', 'intro must be 1-60 characters', 'intro')
  }
  // Same check as the screen, so mock and screen agree.
  if (hasContactInfo(intro)) {
    return errorResponse(400, 'CONTACT_INFO_NOT_ALLOWED', 'contact info is not allowed', 'intro')
  }
  return null
}

export const companionHandlers = [
  http.get('/api/events/:eventId/companions', async ({ request, params }) => {
    await mockDelay()
    const eventId = Number(params.eventId)
    const event = toEventSummary(eventId)
    if (!event) return errorResponse(404, 'EVENT_NOT_FOUND', 'event not found')

    const url = new URL(request.url)
    const filter = url.searchParams.get('status') ?? 'OPEN'
    if (filter !== 'OPEN' && filter !== 'ALL') {
      return errorResponse(400, 'VALIDATION_ERROR', 'status must be OPEN or ALL')
    }
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get('size') ?? 20) || 20))

    const meId = currentUserId(request)
    const matched = posts
      .filter((post) => post.eventId === eventId)
      .filter((post) => filter === 'ALL' || statusOf(post) === 'OPEN')
      .sort(
        (a, b) =>
          STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)] ||
          new Date(a.meetAt).getTime() - new Date(b.meetAt).getTime(),
      )
    const items = matched.slice((page - 1) * size, page * size).map((post) => toSummary(post, meId))

    return HttpResponse.json({ event, items, page, size, total: matched.length })
  }),
  http.post('/api/events/:eventId/companions', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const eventId = Number(params.eventId)
    const event = toEventSummary(eventId)
    if (!event) return errorResponse(404, 'EVENT_NOT_FOUND', 'event not found')
    if (new Date(event.endDate).getTime() <= Date.now()) {
      return errorResponse(422, 'EVENT_ENDED', 'event has ended')
    }
    if (posts.some((p) => p.eventId === eventId && p.authorId === meId && statusOf(p) === 'OPEN')) {
      return errorResponse(409, 'ALREADY_POSTED', 'an open post already exists')
    }

    const body = (await request.json().catch(() => ({}))) as Partial<CreateCompanionBody>
    const invalid = validateBody(body, event.endDate)
    if (invalid) return invalid

    const now = new Date().toISOString()
    const post = {
      id: nextPostId++,
      eventId,
      authorId: meId,
      intro: body.intro!.trim(),
      meetAt: body.meetAt!,
      capacity: body.capacity!,
      members: [{ userId: meId, joinedAt: now }],
      createdAt: now,
    }
    posts.push(post)
    return HttpResponse.json(toDetail(post, meId), { status: 201 })
  }),
  http.get('/api/companions/:postId', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    runAutoAccept(post)
    return HttpResponse.json(toDetail(post, meId))
  }),

  http.post('/api/companions/:postId/requests', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    if (post.authorId === meId) return errorResponse(403, 'OWN_POST', 'cannot request own post')
    if (requests.some((r) => r.postId === post.id && r.userId === meId)) {
      return errorResponse(409, 'ALREADY_REQUESTED', 'already requested')
    }
    const status = statusOf(post)
    if (status === 'FULL') return errorResponse(409, 'POST_FULL', 'post is full')
    if (status === 'CLOSED') return errorResponse(409, 'POST_CLOSED', 'post is closed')

    requests.push({
      id: nextRequestId++,
      postId: post.id,
      userId: meId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    })
    return HttpResponse.json(toDetail(post, meId), { status: 201 })
  }),

  http.delete('/api/companions/:postId/requests/me', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    const index = requests.findIndex((r) => r.postId === post.id && r.userId === meId)
    if (index === -1) return errorResponse(404, 'REQUEST_NOT_FOUND', 'request not found')
    if (requests[index].status !== 'PENDING') {
      return errorResponse(409, 'REQUEST_NOT_PENDING', 'request is not pending')
    }
    requests.splice(index, 1)
    return HttpResponse.json(toDetail(post, meId))
  }),

  http.post('/api/companions/:postId/requests/:requestId/:action', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    if (params.action !== 'accept' && params.action !== 'reject') {
      return errorResponse(404, 'NOT_FOUND', 'unknown action')
    }
    if (post.authorId !== meId)
      return errorResponse(403, 'NOT_AUTHOR', 'only the author can do this')
    const target = requests.find((r) => r.postId === post.id && r.id === Number(params.requestId))
    if (!target) return errorResponse(404, 'REQUEST_NOT_FOUND', 'request not found')
    if (target.status !== 'PENDING') {
      return errorResponse(409, 'REQUEST_NOT_PENDING', 'request is not pending')
    }

    if (params.action === 'reject') {
      target.status = 'REJECTED'
    } else {
      const status = statusOf(post)
      if (status === 'CLOSED') return errorResponse(409, 'POST_CLOSED', 'post is closed')
      if (status === 'FULL') return errorResponse(409, 'POST_FULL', 'post is full')
      acceptRequest(post, target)
    }
    return HttpResponse.json(toDetail(post, meId))
  }),
]
