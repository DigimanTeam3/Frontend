import type { Badge } from '@/shared/types/badge'

/** joined: "I will go". verified: the location check-in at the venue passed. */
export type ParticipationStatus = 'joined' | 'verified'

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

/** Body of POST /participations/{participationId}/verify. */
export interface VerifyRequest {
  lat: number
  lng: number
  /** Accuracy of the position in meters. The server refuses a position that is too rough. */
  accuracy?: number
}

/** Answer of POST /participations/{participationId}/verify. */
export interface VerifyResult {
  participation: Participation
  /** Meters between the sent position and the venue, measured by the server. */
  distanceM: number
  /** The participation badge this check-in earned. */
  badge: Badge
}
