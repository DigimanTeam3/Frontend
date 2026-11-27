import type { Badge } from '@/shared/types/badge'

/**
 * joined: "I will go". verified: the location check-in at the venue passed. completed: every
 * required mission is done as well. Use isCheckedIn() to ask "has the check-in passed?".
 */
export type ParticipationStatus = 'joined' | 'verified' | 'completed'

/** POST / GET /events/{eventId}/participation */
export interface Participation {
  id: number
  eventId: number
  userId: number
  status: ParticipationStatus
  verificationMethod: 'gps' | null
  verifiedAt: string | null
  createdAt: string
}

/** Body of POST /participations/{participationId}/verify. The server does not store the position. */
export interface VerifyRequest {
  latitude: number
  longitude: number
  /** Accuracy of the position in meters. The server refuses a position that is too rough. */
  accuracy?: number
}

/** Answer of POST /participations/{participationId}/verify. */
export interface VerifyResult {
  participationId: number
  eventId: number
  status: ParticipationStatus
  /** Meters between the sent position and the venue, measured by the server. */
  distanceMeters: number
  verifiedAt: string
  /** The participation badge this check-in earned. */
  participationBadge: Badge
}
