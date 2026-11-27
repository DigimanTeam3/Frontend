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

/** One item of GET /me/participations. */
export interface MyParticipation {
  participation: Participation
  event: EventBrief
}
