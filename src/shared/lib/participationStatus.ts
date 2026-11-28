import type { ParticipationStatus } from '@/shared/types/participation'

/** The location check-in has passed: "verified", and "completed" (all required missions done too). */
export function isCheckedIn(status: ParticipationStatus | null | undefined) {
  return status === 'verified' || status === 'completed'
}
