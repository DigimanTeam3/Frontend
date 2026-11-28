import { ja } from '@/shared/i18n/ja'
import { isApiError } from '@/shared/api/errors'
import { formatDistance } from '@/shared/lib/formatDistance'
import type { GeolocationErrorCode } from '@/shared/lib/geolocation'
import { formatMonthDay } from '@/shared/lib/seoulDate'
import type { JourneyEvent } from '@/shared/types/eventBrief'

// Used only while the event does not carry `verificationRadius` (the mock events of the event
// screens, until S05 lands).
const DEFAULT_RADIUS_M = 300

/** How far from the venue the check-in passes, in meters. The server judges; this is for the texts. */
export function venueRadiusM(event: JourneyEvent) {
  return event.verificationRadius ?? DEFAULT_RADIUS_M
}

/** Why a check-in did not pass. One reason = one row of the Figma failure sheet (S09). */
export type CheckInFailureReason =
  | 'PERMISSION_DENIED'
  /** Also a timeout and a browser without geolocation: the answer is the same for the user. */
  | 'POSITION_UNAVAILABLE'
  | 'LOW_ACCURACY'
  | 'OUT_OF_RANGE'
  | 'EVENT_ENDED'
  | 'EVENT_NOT_STARTED'
  | 'ALREADY_VERIFIED'
  /** The event has no venue position on the server, so nobody can check in. */
  | 'EVENT_LOCATION_UNAVAILABLE'
  /** No answer, a server error, or a code this screen does not know. */
  | 'NETWORK'

export interface CheckInFailure {
  reason: CheckInFailureReason
  /** OUT_OF_RANGE only, when the server sent them: how far away I am, and the allowed radius. */
  distanceM?: number
  radiusM?: number
}

/** null for ABORTED: the request was cancelled, so nothing is shown. */
export function failureFromGeolocation(code: GeolocationErrorCode): CheckInFailure | null {
  switch (code) {
    case 'ABORTED':
      return null
    case 'PERMISSION_DENIED':
      return { reason: 'PERMISSION_DENIED' }
    case 'LOW_ACCURACY':
      return { reason: 'LOW_ACCURACY' }
    default:
      return { reason: 'POSITION_UNAVAILABLE' }
  }
}

/** Picks the reason by the error `code`; the server `message` is never shown. */
export function failureFromApiError(error: unknown): CheckInFailure {
  const info = isApiError(error) ? error.body : null
  const code = info?.code
  switch (code) {
    case 'OUT_OF_RANGE': {
      // detail: { distanceMeters, radiusMeters }
      const detail = (info?.detail ?? {}) as Record<string, unknown>
      const distanceM = detail.distanceMeters
      const radiusM = detail.radiusMeters
      return {
        reason: 'OUT_OF_RANGE',
        distanceM: typeof distanceM === 'number' ? distanceM : undefined,
        radiusM: typeof radiusM === 'number' ? radiusM : undefined,
      }
    }
    case 'LOW_ACCURACY':
    case 'EVENT_ENDED':
    case 'EVENT_NOT_STARTED':
    case 'ALREADY_VERIFIED':
    case 'EVENT_LOCATION_UNAVAILABLE':
      return { reason: code }
    default:
      return { reason: 'NETWORK' }
  }
}

/**
 * One paragraph of the error card. The object form is a sentence around the venue name: the
 * name stays its own piece so the card can mark a Korean original with lang="ko".
 */
export type FailureParagraph =
  string | { beforeVenue: string; venue: string; venueLang: 'ko' | undefined; afterVenue: string }

/** Body text of the error card, one entry per paragraph. */
export function failureBody(failure: CheckInFailure, event: JourneyEvent): FailureParagraph[] {
  const copy = ja.checkIn.failureBody
  switch (failure.reason) {
    case 'OUT_OF_RANGE': {
      const radiusM = failure.radiusM ?? venueRadiusM(event)
      if (failure.distanceM === undefined) return [copy.outOfRange(radiusM)]
      return [
        copy.outOfRangeDistance(formatDistance(failure.distanceM)),
        {
          ...copy.outOfRangeRetry(radiusM),
          venue: event.venueNameJa ?? event.venueName,
          venueLang: event.venueNameJa === null ? 'ko' : undefined,
        },
      ]
    }
    case 'EVENT_ENDED':
    case 'EVENT_NOT_STARTED':
      return [copy.period(formatMonthDay(event.startDate), formatMonthDay(event.endDate))]
    default:
      return [copy[failure.reason]]
  }
}
