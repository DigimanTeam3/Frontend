import type { EventBrief } from '@/shared/types/eventBrief'
import type { Participation } from '@/shared/types/participation'

/** GET /me: the logged-in user (the fields My Page reads). */
export interface User {
  id: number
  /** How the user logged in: LINE, or the demo (guest) account. */
  provider: 'line' | 'demo'
  nickname: string
  profileImage: string | null
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

/** My participation as the My Page list carries it. */
export interface MyParticipationRecord extends Participation {
  userId: number
  verificationMethod: string | null
  createdAt: string
}

/** One item of GET /me/participations. */
export interface MyParticipation {
  participation: MyParticipationRecord
  event: EventBrief
}
