import { http, HttpResponse } from 'msw/http'
import { MOCK_ME_ID, posts, statusOf, toEventSummary, toSummary } from '@/mocks/data/companions'
import type { CompanionStatus } from '@/shared/types/companion'

// Companion API mocks (S06–S08). Shapes follow the API proposals in GitHub issues (S06 #16).

const MOCK_TOKEN = 'Bearer mock-access-token'
const STATUS_ORDER: Record<CompanionStatus, number> = { OPEN: 0, FULL: 1, CLOSED: 2 }

function currentUserId(request: Request): number | null {
  return request.headers.get('Authorization') === MOCK_TOKEN ? MOCK_ME_ID : null
}

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

export const companionHandlers = [
  http.get('/api/events/:eventId/companions', ({ request, params }) => {
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
]
