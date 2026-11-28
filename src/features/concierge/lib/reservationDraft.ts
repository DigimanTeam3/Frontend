import type { ConciergeConditions } from '@/shared/types/concierge'

// 「この条件で予約券をつくる」 hands the search conditions to S17 (/me/tickets).
// Router state is lost when RequireAuth sends a logged-out visitor to /login first,
// so the conditions also wait in sessionStorage (this tab only) until S17 reads them.
const KEY = 'digiman.concierge.reservationConditions'

export function saveReservationConditions(conditions: ConciergeConditions) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(conditions))
  } catch {
    // Storage blocked (private mode): router state still carries them when logged in.
  }
}

/** For S17: returns the saved conditions once and clears them. */
export function takeReservationConditions(): ConciergeConditions | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return raw ? (JSON.parse(raw) as ConciergeConditions) : null
  } catch {
    return null
  }
}
