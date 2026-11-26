import { events } from '@/mocks/data/events'
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

// Japanese names for the sample events in events.ts.
const eventNamesJa: Record<number, { titleJa: string; venueNameJa: string }> = {
  1: { titleJa: '清渓川ナイトウォーク', venueNameJa: '清渓川広場' },
  2: { titleJa: '新村ストリートライブ', venueNameJa: '延世路' },
}

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
  const event = events.find((e) => e.id === eventId)
  if (!event) return null
  return {
    id: event.id,
    title: event.title,
    titleJa: eventNamesJa[event.id]?.titleJa ?? null,
    venueName: event.venue_name,
    venueNameJa: eventNamesJa[event.id]?.venueNameJa ?? null,
    imageUrl: event.image_url,
    startDate: event.start_date,
    endDate: event.end_date,
  }
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
