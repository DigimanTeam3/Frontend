import { http, HttpResponse } from 'msw/http'
import { listBadges } from '@/mocks/data/journey'
import { currentUserId, mockDelay, unauthorizedResponse } from '@/mocks/utils'
import { mypageForcedError } from '@/mocks/mypageMock'
import type { Badge, BadgeType } from '@/shared/types/badge'
import type { Page } from '@/shared/types/page'

// My badges mock (S10 reads the participation badge of an event). Shapes follow the backend
// API spec v0.3, in camelCase. The badges come from the journey state: a check-in (S09)
// creates the participation badge.

const DEFAULT_PAGE_SIZE = 20

function parsePositiveInt(value: string | null, fallback: number) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

export const badgeHandlers = [
  http.get('/api/me/badges', async ({ request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()

    const url = new URL(request.url)
    const type = url.searchParams.get('badgeType')
    // The list without a type is My Page's (S15); its error switch is in mypageMock.ts.
    if (type === null) {
      const forced = mypageForcedError('badges')
      if (forced) return forced
    }
    const badgeType =
      type === 'participation' || type === 'complete' ? (type as BadgeType) : undefined
    const page = parsePositiveInt(url.searchParams.get('page'), 1)
    const size = parsePositiveInt(url.searchParams.get('size'), DEFAULT_PAGE_SIZE)

    const all = listBadges(badgeType)
    const body: Page<Badge> = {
      items: all.slice((page - 1) * size, page * size),
      total: all.length,
      page,
      size,
    }
    return HttpResponse.json(body)
  }),
]
