import { ja } from '@/shared/i18n/ja'
import { apiErrorInfo } from '@/shared/lib/apiError'
import { formatDistance } from '@/shared/lib/formatDistance'
import type { GeolocationErrorCode } from '@/shared/lib/geolocation'
import { formatMonthDay } from '@/shared/lib/seoulDate'
import type { JourneyEvent } from '@/shared/types/eventBrief'

// TODO(api): the venue radius belongs to the server and is not in the event shape. Until the
// event carries it, the intro step and the short out-of-range text use the planned 300m.
export const DEFAULT_RADIUS_M = 300

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
  const info = apiErrorInfo(error)
  const code = info?.code
  switch (code) {
    case 'OUT_OF_RANGE': {
      const { distanceM, radiusM } = (info?.detail ?? {}) as Record<string, unknown>
      return typeof distanceM === 'number' && typeof radiusM === 'number'
        ? { reason: 'OUT_OF_RANGE', distanceM, radiusM }
        : { reason: 'OUT_OF_RANGE' }
    }
    case 'LOW_ACCURACY':
    case 'EVENT_ENDED':
    case 'EVENT_NOT_STARTED':
    case 'ALREADY_VERIFIED':
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
    case 'OUT_OF_RANGE':
      if (failure.distanceM === undefined || failure.radiusM === undefined) {
        return [copy.outOfRange(DEFAULT_RADIUS_M)]
      }
      return [
        copy.outOfRangeDistance(formatDistance(failure.distanceM)),
        {
          ...copy.outOfRangeRetry(failure.radiusM),
          venue: event.venueNameJa ?? event.venueName,
          venueLang: event.venueNameJa === null ? 'ko' : undefined,
        },
      ]
    case 'EVENT_ENDED':
    case 'EVENT_NOT_STARTED':
      return [copy.period(formatMonthDay(event.startDate), formatMonthDay(event.endDate))]
    default:
      return [copy[failure.reason]]
  }
}
