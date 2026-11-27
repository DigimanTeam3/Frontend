import type {
  CompanionPostSummary,
  CompanionRequestStatus,
  CompanionStatus,
  EventSummary,
  UserSummary,
} from '@/shared/types/companion'

// In-memory companion data for mock mode. Changes last until the page is reloaded.

/** The user behind the mock login token. */
export const MOCK_ME_ID = 1

const users: Record<number, UserSummary> = {
  1: { id: 1, nickname: 'りん' },
  11: { id: 11, nickname: 'ゆい' },
  12: { id: 12, nickname: 'さき' },
  13: { id: 13, nickname: 'みほ' },
  14: { id: 14, nickname: 'はるな' },
  15: { id: 15, nickname: 'そら' },
}

// Events the companion responses point at. Ids match the event mock so links between screens line up.
const companionEvents: EventSummary[] = [
  {
    id: 1,
    title: '샘플 행사: 청계천 야경 산책',
    titleJa: '清渓川ナイトウォーク',
    venueName: '청계천',
    venueNameJa: '清渓川広場',
    imageUrl: null,
    startDate: '2026-11-27T18:00:00+09:00',
    endDate: '2026-12-14T22:00:00+09:00',
  },
  {
    id: 2,
    title: '샘플 행사: 신촌 거리 공연',
    titleJa: '新村ストリートライブ',
    venueName: '연세로',
    venueNameJa: '延世路',
    imageUrl: null,
    startDate: '2026-11-29T14:00:00+09:00',
    endDate: '2026-11-29T17:00:00+09:00',
  },
]

export interface MockMember {
  userId: number
  joinedAt: string
}

export interface MockPost {
  id: number
  eventId: number
  authorId: number
  intro: string
  meetAt: string
  capacity: number
  /** Author first, then accepted people in order. */
  members: MockMember[]
  createdAt: string
}

export interface MockRequest {
  id: number
  postId: number
  userId: number
  status: CompanionRequestStatus
  createdAt: string
}

export const posts: MockPost[] = [
  {
    id: 101,
    eventId: 1,
    authorId: 11,
    intro: '一緒にランタンを見に行きませんか？写真を撮り合いましょう',
    meetAt: '2026-12-06T18:00:00+09:00',
    capacity: 4,
    members: [
      { userId: 11, joinedAt: '2026-11-25T20:00:00+09:00' },
      { userId: 12, joinedAt: '2026-11-25T21:10:00+09:00' },
    ],
    createdAt: '2026-11-25T20:00:00+09:00',
  },
  {
    id: 102,
    eventId: 1,
    authorId: MOCK_ME_ID,
    intro: '金曜の夜、仕事終わりにさくっと見に行く人！',
    meetAt: '2026-12-04T19:30:00+09:00',
    capacity: 2,
    members: [{ userId: MOCK_ME_ID, joinedAt: '2026-11-26T10:00:00+09:00' }],
    createdAt: '2026-11-26T10:00:00+09:00',
  },
  {
    id: 103,
    eventId: 1,
    authorId: 13,
    intro: '週末の昼にランタン準備の様子を見に行きませんか',
    meetAt: '2026-11-30T13:00:00+09:00',
    capacity: 3,
    members: [
      { userId: 13, joinedAt: '2026-11-24T09:00:00+09:00' },
      { userId: 14, joinedAt: '2026-11-24T12:00:00+09:00' },
      { userId: 15, joinedAt: '2026-11-24T18:30:00+09:00' },
    ],
    createdAt: '2026-11-24T09:00:00+09:00',
  },
  {
    id: 104,
    eventId: 1,
    authorId: 15,
    intro: '初日の点灯式、一緒に見ませんか',
    meetAt: '2026-11-26T18:00:00+09:00',
    capacity: 2,
    members: [{ userId: 15, joinedAt: '2026-11-20T08:00:00+09:00' }],
    createdAt: '2026-11-20T08:00:00+09:00',
  },
]

export const requests: MockRequest[] = [
  { id: 501, postId: 102, userId: 13, status: 'PENDING', createdAt: '2026-11-26T12:00:00+09:00' },
  { id: 502, postId: 102, userId: 14, status: 'PENDING', createdAt: '2026-11-26T12:40:00+09:00' },
]

export function findUser(userId: number): UserSummary {
  return users[userId] ?? { id: userId, nickname: 'ゲスト' }
}

export function toEventSummary(eventId: number): EventSummary | null {
  const event = companionEvents.find((e) => e.id === eventId)
  return event ? { ...event } : null
}

export function statusOf(post: MockPost): CompanionStatus {
  if (post.members.length >= post.capacity) return 'FULL'
  if (new Date(post.meetAt).getTime() <= Date.now()) return 'CLOSED'
  return 'OPEN'
}

export function toSummary(post: MockPost, meId: number | null): CompanionPostSummary {
  const isMine = meId !== null && post.authorId === meId
  const myRequest =
    meId !== null && !isMine
      ? requests.find((r) => r.postId === post.id && r.userId === meId)
      : undefined
  return {
    id: post.id,
    eventId: post.eventId,
    author: findUser(post.authorId),
    intro: post.intro,
    meetAt: post.meetAt,
    capacity: post.capacity,
    memberCount: post.members.length,
    status: statusOf(post),
    isMine,
    myRequestStatus: myRequest?.status ?? null,
    createdAt: post.createdAt,
  }
}
