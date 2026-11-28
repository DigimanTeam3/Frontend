import { MOCK_USER_ID } from '@/mocks/mockHelpers'
import type { Badge, BadgeType } from '@/shared/types/badge'
import type { ExperienceCard, ExperienceCardUpdate } from '@/shared/types/card'
import type { EventBrief, JourneyEvent } from '@/shared/types/eventBrief'
import type {
  Mission,
  MissionListResponse,
  Submission,
  SubmissionResult,
} from '@/shared/types/mission'
import type { MyCompanion, MyParticipation, MySummary } from '@/shared/types/me'
import type { Participation, ParticipationStatus } from '@/shared/types/participation'

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

type MissionTemplate = Omit<Mission, 'mySubmission'>

// Missions per event: event 1 mirrors the Figma list, event 25 (indoor demo) works anywhere,
// event 4 has one so its Korean-only card can be made. Other events have none. Missions 102 and
// 401 have no Japanese text, to show the lang="ko" fallback.
const missionTemplates: MissionTemplate[] = [
  {
    id: 401,
    eventId: 4,
    title: '마음에 드는 물건 하나 찾기',
    titleJa: null,
    description: '플리마켓에서 마음에 든 물건을 한마디로 적어 주세요.',
    descriptionJa: null,
    difficulty: 'easy',
    verificationMethod: 'text',
    required: true,
    sortOrder: 1,
  },
  {
    id: 101,
    eventId: 1,
    title: '등불 앞에서 셀카 찍기',
    titleJa: '提灯の前で自撮り',
    description: '마음에 드는 등불 앞에서 셀카를 찍어 보내 주세요.',
    descriptionJa: '好きな提灯の前で自撮りをして、写真を送ってください。',
    difficulty: 'easy',
    verificationMethod: 'photo',
    required: true,
    sortOrder: 1,
  },
  {
    id: 102,
    eventId: 1,
    title: '제일 마음에 드는 등불 찍기',
    titleJa: null,
    description: '가장 마음에 든 등불의 사진을 보내 주세요.',
    descriptionJa: null,
    difficulty: 'easy',
    verificationMethod: 'photo',
    required: true,
    sortOrder: 2,
  },
  {
    id: 103,
    eventId: 1,
    title: '포장마차에서 뭔가 먹어 보기',
    titleJa: '屋台で何か食べてみる',
    description: '먹은 음식의 사진과 한마디를 보내 주세요.',
    descriptionJa: '食べたものの写真と、ひとことを送ってください。',
    difficulty: 'normal',
    verificationMethod: 'photo',
    required: true,
    sortOrder: 3,
  },
  {
    id: 104,
    eventId: 1,
    title: '한국어로 "예쁘다"라고 말해 보기',
    titleJa: '韓国語で「きれい」と言ってみる',
    description: '한국어로 "예쁘다"라고 말해 본 소감을 적어 주세요.',
    descriptionJa: '韓国語で「きれい」と言ってみた感想を書いてください。',
    difficulty: 'hard',
    verificationMethod: 'text',
    required: false,
    sortOrder: 4,
  },
  {
    id: 251,
    eventId: INDOOR_DEMO_EVENT_ID,
    title: '행사장 입구에서 사진 찍기',
    titleJa: '会場の入口で写真を撮る',
    description: '행사장 입구가 보이는 사진을 보내 주세요.',
    descriptionJa: '会場の入口が写った写真を送ってください。',
    difficulty: 'easy',
    verificationMethod: 'photo',
    required: true,
    sortOrder: 1,
  },
  {
    id: 252,
    eventId: INDOOR_DEMO_EVENT_ID,
    title: '오늘의 소감 한마디',
    titleJa: '今日の感想をひとこと',
    description: '오늘 행사의 소감을 한마디로 적어 주세요.',
    descriptionJa: '今日のイベントの感想をひとことで書いてください。',
    difficulty: 'easy',
    verificationMethod: 'text',
    required: true,
    sortOrder: 2,
  },
  {
    id: 253,
    eventId: INDOOR_DEMO_EVENT_ID,
    title: '옆 사람에게 인사하기',
    titleJa: 'となりの人にあいさつする',
    description: '옆에 있는 사람에게 인사를 건넨 소감을 적어 주세요.',
    descriptionJa: 'となりの人にあいさつをした感想を書いてください。',
    difficulty: 'normal',
    verificationMethod: 'text',
    required: false,
    sortOrder: 3,
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
// Experience cards made by the mock start at this id.
const FIRST_CARD_ID = 3

interface JourneyState {
  nextParticipationId: number
  nextBadgeId: number
  participations: Participation[]
  badges: Badge[]
  nextSubmissionId: number
  submissions: Submission[]
  nextCardId: number
  cards: ExperienceCard[]
}

const STORAGE_KEY = 'digiman.mock.journey'

function emptyState(): JourneyState {
  return {
    nextParticipationId: FIRST_PARTICIPATION_ID,
    nextBadgeId: 1,
    participations: [],
    badges: [],
    nextSubmissionId: 1,
    submissions: [],
    nextCardId: FIRST_CARD_ID,
    cards: [],
  }
}

// The user starts with one finished past event, so My Page and the card screens have something to
// show before a check-in is done in the session: event 5 (ended), verified on 2026-11-15, both
// badges and card 1 (no own photo, a memo).
const SEED_EVENT_ID = 5
const SEED_PARTICIPATION_ID = 41
const SEED_CARD_ID = 1
const SEED_VERIFIED_AT = '2026-11-15T19:30:00+09:00'
const SEED_MEMO = '夜の宮殿、とてもきれいでした。'

function initialState(): JourneyState {
  const state = emptyState()
  const event = findJourneyEvent(SEED_EVENT_ID)
  if (!event) return state

  const brief = toEventBrief(event)
  const participationBadge: Badge = {
    id: state.nextBadgeId++,
    eventId: event.id,
    badgeType: 'participation',
    badgeImage: MOCK_BADGE_IMAGE,
    acquiredAt: SEED_VERIFIED_AT,
    event: brief,
  }
  const completeBadge: Badge = {
    id: state.nextBadgeId++,
    eventId: event.id,
    badgeType: 'complete',
    badgeImage: MOCK_BADGE_IMAGE,
    acquiredAt: '2026-11-15T20:10:00+09:00',
    event: brief,
  }
  state.participations.push({
    id: SEED_PARTICIPATION_ID,
    eventId: event.id,
    userId: MOCK_USER_ID,
    status: 'verified',
    verificationMethod: 'gps',
    verifiedAt: SEED_VERIFIED_AT,
    createdAt: '2026-11-14T12:00:00+09:00',
  })
  state.badges.push(participationBadge, completeBadge)
  state.cards.push({
    id: SEED_CARD_ID,
    event: brief,
    eventDate: SEED_VERIFIED_AT.slice(0, 10),
    venue: event.venueName,
    venueJa: event.venueNameJa,
    eventImage: event.imageUrl,
    userImage: null,
    memo: SEED_MEMO,
    participationBadge,
    completeBadge,
    createdAt: completeBadge.acquiredAt,
  })
  return state
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

/** Back to the start: the seeded finished event only (see initialState). */
export function resetJourneyMock() {
  state = initialState()
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing was stored.
  }
}

/** Forgets everything, the seeded event too: a user who has done nothing yet (local preview). */
export function clearJourneyMock() {
  state = emptyState()
  saveState()
}

export function findParticipation(eventId: number, userId: number) {
  return state.participations.find((p) => p.eventId === eventId && p.userId === userId)
}

export function findParticipationById(participationId: number) {
  return state.participations.find((p) => p.id === participationId)
}

/** My badges, newest first; every badge belongs to the one mock user. */
export function listBadges(badgeType?: BadgeType) {
  return state.badges
    .filter((badge) => badgeType === undefined || badge.badgeType === badgeType)
    .toReversed()
}

/** My participations with their events, newest first, like GET /me/participations. */
export function listParticipations(
  userId: number,
  status?: ParticipationStatus,
): MyParticipation[] {
  return state.participations
    .filter((p) => p.userId === userId && (status === undefined || p.status === status))
    .toReversed()
    .flatMap((participation) => {
      const event = findJourneyEvent(participation.eventId)
      return event ? [{ participation, event: toEventBrief(event) }] : []
    })
}

/** The counts of GET /me/summary, computed from the state. */
export function summarize(userId: number): MySummary {
  const mine = state.participations.filter((p) => p.userId === userId)
  return {
    participatedEventCount: mine.length,
    verifiedEventCount: mine.filter((p) => p.status === 'verified').length,
    participationBadgeCount: state.badges.filter((b) => b.badgeType === 'participation').length,
    completeBadgeCount: state.badges.filter((b) => b.badgeType === 'complete').length,
    experienceCardCount: state.cards.length,
    recruitmentCount: listMyCompanions().filter((post) => post.isMine).length,
  }
}

// TODO(api): GET /me/companions is not spelled out in the spec (v2). Fixed sample posts: two I
// wrote and one I joined. The posts themselves belong to the companion mock (S06–S08), which
// does not know these ids.
const myCompanionSeeds: Omit<MyCompanion, 'event'>[] = [
  {
    id: 301,
    meetAt: '2026-11-28T18:00:00+09:00',
    capacity: 3,
    memberCount: 2,
    status: 'OPEN',
    isMine: true,
  },
  {
    id: 302,
    meetAt: '2026-11-29T14:00:00+09:00',
    capacity: 2,
    memberCount: 2,
    status: 'FULL',
    isMine: true,
  },
  {
    id: 303,
    meetAt: '2026-11-15T19:00:00+09:00',
    capacity: 4,
    memberCount: 3,
    status: 'CLOSED',
    isMine: false,
  },
]
const MY_COMPANION_EVENT_IDS = [1, INDOOR_DEMO_EVENT_ID, 5]

/** My companion posts with their events, like GET /me/companions. */
export function listMyCompanions(): MyCompanion[] {
  return myCompanionSeeds.flatMap((post, index) => {
    const event = findJourneyEvent(MY_COMPANION_EVENT_IDS[index] ?? 0)
    return event ? [{ ...post, event: toEventBrief(event) }] : []
  })
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

/** The missions of an event with my progress. Logged out (userId null): locked, nothing done. */
export function listMissions(eventId: number, userId: number | null): MissionListResponse {
  const isVerified = userId !== null && findParticipation(eventId, userId)?.status === 'verified'
  const items: Mission[] = missionTemplates
    .filter((mission) => mission.eventId === eventId)
    .map((mission) => ({
      ...mission,
      mySubmission:
        userId === null
          ? null
          : (state.submissions.find((s) => s.missionId === mission.id && s.userId === userId) ??
            null),
    }))
  const required = items.filter((mission) => mission.required)
  return {
    items,
    requiredCount: required.length,
    myCompletedRequiredCount: required.filter((mission) => mission.mySubmission).length,
    isVerified,
  }
}

export function findMission(missionId: number) {
  return missionTemplates.find((mission) => mission.id === missionId)
}

export function findSubmission(missionId: number, userId: number) {
  return state.submissions.find((s) => s.missionId === missionId && s.userId === userId)
}

const NOTHING_EARNED = { completeBadge: null, experienceCard: null }

/**
 * Hands out the complete badge and the experience card when every required mission of the
 * event is done. Nothing while one is open, or when the card already exists.
 */
function completeEvent(
  eventId: number,
  userId: number,
): Pick<SubmissionResult, 'completeBadge' | 'experienceCard'> {
  const event = findJourneyEvent(eventId)
  const verifiedAt = findParticipation(eventId, userId)?.verifiedAt
  const participationBadge = state.badges.find(
    (badge) => badge.eventId === eventId && badge.badgeType === 'participation',
  )
  if (!event || !verifiedAt || !participationBadge) return NOTHING_EARNED
  if (state.cards.some((card) => card.event.id === eventId)) return NOTHING_EARNED

  const required = missionTemplates.filter((m) => m.eventId === eventId && m.required)
  const mine = state.submissions.filter(
    (s) => s.userId === userId && findMission(s.missionId)?.eventId === eventId,
  )
  if (!required.every((m) => mine.some((s) => s.missionId === m.id))) return NOTHING_EARNED

  const now = nowIso()
  const completeBadge: Badge = {
    id: state.nextBadgeId++,
    eventId,
    badgeType: 'complete',
    badgeImage: MOCK_BADGE_IMAGE,
    acquiredAt: now,
    event: toEventBrief(event),
  }
  const experienceCard: ExperienceCard = {
    id: state.nextCardId++,
    event: toEventBrief(event),
    // verifiedAt is written in Seoul time, so its first ten characters are the Seoul day.
    eventDate: verifiedAt.slice(0, 10),
    venue: event.venueName,
    venueJa: event.venueNameJa,
    eventImage: event.imageUrl,
    // My first photo of this event.
    userImage: mine.find((s) => s.image !== null)?.image ?? null,
    memo: null,
    participationBadge,
    completeBadge,
    createdAt: now,
  }
  state.badges.push(completeBadge)
  state.cards.push(experienceCard)
  return { completeBadge, experienceCard }
}

/**
 * Records an approved submission (a mission is approved at once), in the shape of
 * POST /missions/{missionId}/submissions. Returns the existing one when there is one.
 */
export function submitMission(
  mission: Pick<Mission, 'id' | 'eventId' | 'required' | 'verificationMethod'>,
  userId: number,
  input: { image?: string; text?: string },
): SubmissionResult {
  const existing = findSubmission(mission.id, userId)
  if (existing) return { submission: existing, ...NOTHING_EARNED }

  const submission: Submission = {
    id: state.nextSubmissionId++,
    missionId: mission.id,
    userId,
    submissionType: mission.verificationMethod,
    text: input.text ?? null,
    image: input.image ?? null,
    verificationStatus: 'approved',
    submittedAt: nowIso(),
  }
  state.submissions.push(submission)
  // Optional missions never lead to the card.
  const earned = mission.required ? completeEvent(mission.eventId, userId) : NOTHING_EARNED
  saveState()
  return { submission, ...earned }
}

/** My experience cards, newest first; every card belongs to the one mock user. */
export function listCards() {
  return state.cards.toReversed()
}

export function findCard(cardId: number) {
  return state.cards.find((card) => card.id === cardId)
}

/** Writes the given fields on the card, like PATCH /experience-cards/{cardId}. */
export function updateCard(card: ExperienceCard, changes: ExperienceCardUpdate) {
  if (changes.memo !== undefined) card.memo = changes.memo
  if (changes.userImage !== undefined) card.userImage = changes.userImage
  saveState()
  return card
}

/**
 * Local preview helper: adds finished cards (with both badges) for the journey events 1–4 in turn,
 * to show My Page with more cards than it lists at first. They have no participation.
 */
export function addDemoCards(count: number) {
  for (let i = 0; i < count; i++) {
    const event = journeyEvents[i % 4]
    if (!event) continue
    const brief = toEventBrief(event)
    const now = nowIso()
    const make = (badgeType: BadgeType): Badge => ({
      id: state.nextBadgeId++,
      eventId: event.id,
      badgeType,
      badgeImage: MOCK_BADGE_IMAGE,
      acquiredAt: now,
      event: brief,
    })
    const participationBadge = make('participation')
    const completeBadge = make('complete')
    state.badges.push(participationBadge, completeBadge)
    state.cards.push({
      id: state.nextCardId++,
      event: brief,
      eventDate: now.slice(0, 10),
      venue: event.venueName,
      venueJa: event.venueNameJa,
      eventImage: event.imageUrl,
      userImage: null,
      memo: null,
      participationBadge,
      completeBadge,
      createdAt: now,
    })
  }
  saveState()
}
