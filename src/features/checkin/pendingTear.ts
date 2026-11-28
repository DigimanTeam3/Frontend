import type { CheckInReading } from '@/features/checkin/useCheckIn'

// The server marks the participation verified as soon as the position passes; tearing the stub
// is only the ceremony on this screen. So a visitor who leaves before tearing would come back to
// "already checked in" and never see the tear or the badge screen. The reading of a passed check
// is kept here, per participation, until the stub is torn: with it the screen opens at the tear
// again. localStorage (not sessionStorage), so it also survives closing the tab or the LINE
// in-app browser. Another device has no record and shows "already checked in" as before.
const KEY_PREFIX = 'digiman.checkin.untorn.'

const keyOf = (participationId: number) => `${KEY_PREFIX}${participationId}`

/** After the server accepted the position: the stub of this participation is not torn yet. */
export function savePendingTear(participationId: number, reading: CheckInReading) {
  try {
    localStorage.setItem(keyOf(participationId), JSON.stringify(reading))
  } catch {
    // Storage blocked: leaving before the tear then shows "already checked in", as before.
  }
}

/** The reading of a passed check whose stub is still attached, or null. */
export function readPendingTear(participationId: number): CheckInReading | null {
  try {
    const raw = localStorage.getItem(keyOf(participationId))
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return null
    const { distanceM, accuracyM } = value as Record<string, unknown>
    return typeof distanceM === 'number' &&
      Number.isFinite(distanceM) &&
      typeof accuracyM === 'number' &&
      Number.isFinite(accuracyM)
      ? { distanceM, accuracyM }
      : null
  } catch {
    return null
  }
}

/** The stub is torn: the next visit shows "already checked in". */
export function clearPendingTear(participationId: number) {
  try {
    localStorage.removeItem(keyOf(participationId))
  } catch {
    // Storage blocked: nothing was stored.
  }
}
