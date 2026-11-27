import type { EventBrief } from '@/shared/types/eventBrief'
import type { Participation } from '@/shared/types/participation'

/** GET /me: the logged-in user. */
export interface User {
  id: number
  /** How the user logged in: LINE, or the demo account. */
  provider: 'line' | 'demo'
  nickname: string
  email: string | null
  language: 'ja' | 'ko'
  profileImage: string | null
  bio: string | null
  isAdmin: boolean
  createdAt: string
}

/** GET /me/summary: counts for My Page. */
export interface MySummary {
  participatedEventCount: number
  verifiedEventCount: number
  participationBadgeCount: number
  completeBadgeCount: number
  experienceCardCount: number
  /** Companion posts written by me. */
  recruitmentCount: number
}

// TODO(api): the backend spec (v2) names GET /me/companions but not its shape. This follows the
// companion post summary of S06 (#16), plus the event the post belongs to.
export type MyCompanionStatus = 'OPEN' | 'FULL' | 'CLOSED'

/** One item of GET /me/companions: a companion post I wrote or joined. */
export interface MyCompanion {
  /** Id of the companion post. */
  id: number
  event: EventBrief
  /** When the group meets (ISO 8601, +09:00). */
  meetAt: string
  /** 2–4, including the author. */
  capacity: number
  /** Author + accepted people. */
  memberCount: number
  status: MyCompanionStatus
  /** True for a post I wrote, false for one of someone else that I joined. */
  isMine: boolean
}

/** One item of GET /me/participations. */
export interface MyParticipation {
  participation: Participation
  event: EventBrief
}
