import { http, HttpResponse } from 'msw/http'
import { listMyCompanions, listParticipations, summarize } from '@/mocks/data/journey'
import { currentUserId, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import { mypageForcedError, mypageLongName } from '@/mocks/mypageMock'
import type { MyCompanion, MyParticipation, User } from '@/shared/types/me'
import type { Page } from '@/shared/types/page'
import type { ParticipationStatus } from '@/shared/types/participation'

// My Page mock (S15): the profile, the counts and my participations. Shapes follow the backend
// API spec v0.3, in camelCase; the counts and the list come from the journey state. My badges and
// cards are answered by badgeHandlers and cardHandlers. Test switches: see mypageMock.ts.

const DEFAULT_PAGE_SIZE = 20
const LONG_NICKNAME = 'ゆい'.repeat(12) + '_とても長いニックネームの確認用'

function parsePositiveInt(value: string | null, fallback: number) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

export const mypageHandlers = [
  http.get('/api/me', async ({ request }) => {
    await mockDelay()
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()
    const forced = mypageForcedError('me')
    if (forced) return forced

    const user: User = {
      id: userId,
      provider: 'line',
      nickname: mypageLongName() ? LONG_NICKNAME : 'ゆい',
      profileImage: null,
    }
    return HttpResponse.json(user)
  }),

  http.get('/api/me/summary', async ({ request }) => {
    await mockDelay()
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()
    const forced = mypageForcedError('summary')
    if (forced) return forced

    return HttpResponse.json(summarize(userId))
  }),

  http.get('/api/me/participations', async ({ request }) => {
    await mockDelay()
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()
    const forced = mypageForcedError('participations')
    if (forced) return forced

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parsePositiveInt(url.searchParams.get('page'), 1)
    const size = parsePositiveInt(url.searchParams.get('size'), DEFAULT_PAGE_SIZE)

    const all = listParticipations(
      userId,
      status === 'joined' || status === 'verified' || status === 'completed'
        ? (status as ParticipationStatus)
        : undefined,
    )
    const body: Page<MyParticipation> = {
      items: all.slice((page - 1) * size, page * size),
      total: all.length,
      page,
      size,
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/me/companions', async ({ request }) => {
    await mockDelay()
    const userId = currentUserId(request)
    if (userId === null) return unauthorizedResponse()
    const forced = mypageForcedError('companions')
    if (forced) return forced

    const url = new URL(request.url)
    const page = parsePositiveInt(url.searchParams.get('page'), 1)
    const size = parsePositiveInt(url.searchParams.get('size'), DEFAULT_PAGE_SIZE)
    const all = listMyCompanions()
    const body: Page<MyCompanion> = {
      items: all.slice((page - 1) * size, page * size),
      total: all.length,
      page,
      size,
    }
    return HttpResponse.json(body)
  }),
]
