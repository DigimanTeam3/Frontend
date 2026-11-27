import type { Badge } from '@/shared/types/badge'
import type { EventBrief, JourneyEvent } from '@/shared/types/eventBrief'
import type { Participation } from '@/shared/types/participation'

// Mock data and state of the journey screens (check-in, badge, missions, card, my page) in one
// module, because their answers depend on each other. The state is kept in sessionStorage so a
// reload keeps the progress; resetJourneyMock() (or closing the tab) starts over.

/** Indoor demo: the check-in of this event passes from anywhere. */
export const INDOOR_DEMO_EVENT_ID = 25
/** Test events: their verify call always fails (see the top of checkinHandlers.ts). */
export const LOW_ACCURACY_EVENT_ID = 9003
export const VERIFY_ERROR_EVENT_ID = 9004
/** Test event that is over and has no seeded participation: joining answers EVENT_ENDED. */
export const ENDED_EVENT_ID = 9005

// Events 1–5 mirror src/mocks/data/events.ts of the event screens (same ids, titles, places).
export const journeyEvents: JourneyEvent[] = [
  {
    id: 1,
    title: '서울빛초롱축제',
    titleJa: 'ソウル光の提灯祭り',
    category: 'festival',
    startDate: '2026-11-01T17:00:00+09:00',
    endDate: '2026-11-30T23:00:00+09:00',
    venueName: '청계천 광장',
    venueNameJa: '清渓川広場（チョンゲチョン）',
    lat: 37.5692,
    lng: 126.9784,
    imageUrl: null,
  },
  {
    id: 2,
    title: '신촌 거리 공연',
    titleJa: '新村ストリートライブ',
    category: 'performance',
    startDate: '2026-11-29T14:00:00+09:00',
    endDate: '2026-11-29T17:00:00+09:00',
    venueName: '연세로',
    venueNameJa: '延世路（ヨンセロ）',
    lat: 37.5579,
    lng: 126.9368,
    imageUrl: null,
  },
  {
    id: 3,
    title: '서울공예박물관 특별전',
    titleJa: 'ソウル工芸博物館 特別展',
    category: 'exhibition',
    startDate: '2026-12-05T10:00:00+09:00',
    endDate: '2027-02-28T18:00:00+09:00',
    venueName: '서울공예박물관',
    venueNameJa: 'ソウル工芸博物館',
    lat: 37.5763,
    lng: 126.9851,
    imageUrl: null,
  },
  {
    // No Japanese fields: screens show the original text with lang="ko".
    id: 4,
    title: '망원 한강공원 플리마켓',
    titleJa: null,
    category: 'festival',
    startDate: '2026-11-28T11:00:00+09:00',
    endDate: '2026-11-29T17:00:00+09:00',
    venueName: '망원한강공원',
    venueNameJa: null,
    lat: 37.5552,
    lng: 126.8956,
    imageUrl: null,
  },
  {
    // Already over: joining answers EVENT_ENDED.
    id: 5,
    title: '덕수궁 야간 개방',
    titleJa: '徳寿宮 夜間開放',
    category: 'exhibition',
    startDate: '2026-11-10T18:00:00+09:00',
    endDate: '2026-11-20T21:00:00+09:00',
    venueName: '덕수궁',
    venueNameJa: '徳寿宮（トクスグン）',
    lat: 37.5658,
    lng: 126.9751,
    imageUrl: null,
  },
  {
    id: INDOOR_DEMO_EVENT_ID,
    title: '신촌 KOREC 실내 데모',
    titleJa: 'KOREC 室内デモイベント',
    category: 'festival',
    startDate: '2026-11-01T00:00:00+09:00',
    endDate: '2026-12-31T23:59:59+09:00',
    venueName: 'KOREC',
    venueNameJa: 'KOREC（新村）',
    lat: 37.5585,
    lng: 126.9388,
    imageUrl: null,
  },
  {
    id: LOW_ACCURACY_EVENT_ID,
    title: '테스트: 위치 정확도 낮음',
    titleJa: 'テスト：位置の精度が低い',
    category: 'exhibition',
    startDate: '2026-11-01T00:00:00+09:00',
    endDate: '2026-12-31T23:59:59+09:00',
    venueName: '테스트 장소',
    venueNameJa: 'テスト会場',
    lat: 37.5585,
    lng: 126.9388,
    imageUrl: null,
  },
  {
    id: VERIFY_ERROR_EVENT_ID,
    title: '테스트: 인증 서버 오류',
    titleJa: 'テスト：確認でサーバーエラー',
    category: 'performance',
    startDate: '2026-11-01T00:00:00+09:00',
    endDate: '2026-12-31T23:59:59+09:00',
    venueName: '테스트 장소',
    venueNameJa: 'テスト会場',
    lat: 37.5585,
    lng: 126.9388,
    imageUrl: null,
  },
  {
    // Event 5 is over too, but the seed has it checked in already (see initialState), so the
    // check-in screen never gets to EVENT_ENDED there.
    id: ENDED_EVENT_ID,
    title: '테스트: 종료된 이벤트',
    titleJa: 'テスト：終了したイベント',
    category: 'festival',
    startDate: '2026-10-01T10:00:00+09:00',
    endDate: '2026-10-31T18:00:00+09:00',
    venueName: '테스트 장소',
    venueNameJa: 'テスト会場',
    lat: 37.5585,
    lng: 126.9388,
    imageUrl: null,
  },
]

export function findJourneyEvent(eventId: number) {
  return journeyEvents.find((event) => event.id === eventId)
}

export function toEventBrief(event: JourneyEvent): EventBrief {
  const { id, title, titleJa, venueName, venueNameJa, imageUrl, startDate, endDate } = event
  return { id, title, titleJa, venueName, venueNameJa, imageUrl, startDate, endDate }
}

/** Now as the API writes times: ISO 8601 in Seoul time ("2026-11-29T18:12:00+09:00"). */
export function nowIso() {
  return `${new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19)}+09:00`
}

// Any image that exists: the screens draw the badge themselves and do not show this file.
const MOCK_BADGE_IMAGE = '/favicon.svg'
// Like the Figma ticket "No.1129-0042".
const FIRST_PARTICIPATION_ID = 42

interface JourneyState {
  nextParticipationId: number
  nextBadgeId: number
  participations: Participation[]
  badges: Badge[]
}

const STORAGE_KEY = 'digiman.mock.journey'

function initialState(): JourneyState {
  return {
    nextParticipationId: FIRST_PARTICIPATION_ID,
    nextBadgeId: 1,
    participations: [],
    badges: [],
  }
}

function loadState(): JourneyState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    // Spread over the initial state so a field added later is present in an older stored state.
    if (stored) return { ...initialState(), ...(JSON.parse(stored) as Partial<JourneyState>) }
  } catch {
    // No storage (private mode) or broken JSON: start fresh.
  }
  return initialState()
}

let state = loadState()

function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Without storage the state still lives until the next reload.
  }
}

/** Forgets every participation and badge of the mock. */
export function resetJourneyMock() {
  state = initialState()
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing was stored.
  }
}

export function findParticipation(eventId: number, userId: number) {
  return state.participations.find((p) => p.eventId === eventId && p.userId === userId)
}

export function findParticipationById(participationId: number) {
  return state.participations.find((p) => p.id === participationId)
}

/** Create-or-get, like POST /events/{eventId}/participation. */
export function joinEvent(eventId: number, userId: number) {
  const existing = findParticipation(eventId, userId)
  if (existing) return { participation: existing, created: false }

  const participation: Participation = {
    id: state.nextParticipationId++,
    eventId,
    userId,
    status: 'joined',
    verificationMethod: null,
    verifiedAt: null,
    createdAt: nowIso(),
  }
  state.participations.push(participation)
  saveState()
  return { participation, created: true }
}

/** Marks the participation verified by GPS and hands out the participation badge. */
export function verifyParticipation(participation: Participation, event: JourneyEvent) {
  const now = nowIso()
  participation.status = 'verified'
  participation.verificationMethod = 'gps'
  participation.verifiedAt = now

  const badge: Badge = {
    id: state.nextBadgeId++,
    eventId: event.id,
    badgeType: 'participation',
    badgeImage: MOCK_BADGE_IMAGE,
    acquiredAt: now,
    event: toEventBrief(event),
  }
  state.badges.push(badge)
  saveState()
  return { participation, badge }
}
