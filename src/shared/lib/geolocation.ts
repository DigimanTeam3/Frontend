// One place for the browser Geolocation API: support check, permission, accuracy, timeout, errors.
// Used by the location check-in (S09) and the map's "my position" (S04).
// Geolocation works on HTTPS (and localhost) only: use `npm run dev:https` or the deployed site on a phone.

/**
 * How long one request may measure before it settles with the best fix so far. The time the
 * browser's permission prompt is open does not count.
 */
export const DEFAULT_TIMEOUT_MS = 10_000
/** A fix this accurate (meters) ends the request at once instead of waiting for a better one. */
export const DEFAULT_DESIRED_ACCURACY_M = 50
/** Longest time the permission prompt may stay unanswered before the request gives up. */
const PROMPT_GRACE_MS = 60_000

export type GeolocationErrorCode =
  /** No Geolocation API, or the page is not served over HTTPS. */
  | 'UNSUPPORTED'
  /** The user or the OS refused the location permission. */
  | 'PERMISSION_DENIED'
  /** The device could not work out a position (GPS off, no signal). */
  | 'POSITION_UNAVAILABLE'
  /** No position arrived within the timeout. */
  | 'TIMEOUT'
  /** A position arrived but it is less accurate than `maxAccuracyM`. */
  | 'LOW_ACCURACY'
  /** The caller cancelled the request (`signal`, or the screen closed). Show nothing for this one. */
  | 'ABORTED'

export class GeolocationError extends Error {
  readonly code: GeolocationErrorCode
  /** Best accuracy reached in meters. Only set for LOW_ACCURACY. */
  readonly accuracy: number | null

  constructor(code: GeolocationErrorCode, accuracy: number | null = null) {
    super(code)
    this.name = 'GeolocationError'
    this.code = code
    this.accuracy = accuracy
  }
}

export function isGeolocationError(error: unknown): error is GeolocationError {
  return error instanceof GeolocationError
}

export interface CurrentPosition {
  lat: number
  lng: number
  /** Radius of the 95% confidence circle in meters (GeolocationCoordinates.accuracy). */
  accuracy: number
  /** When the device measured this position (epoch ms). */
  timestamp: number
}

export interface CurrentPositionOptions {
  /** Default 10s. Measuring never takes longer than this (the permission prompt is not counted). */
  timeoutMs?: number
  /** Default 50m. Resolve as soon as a fix is at least this accurate. */
  desiredAccuracyM?: number
  /** When set, a best fix worse than this rejects with LOW_ACCURACY instead of resolving. */
  maxAccuracyM?: number
  /** Accept a cached position up to this old. Default 0 (always measure again). */
  maximumAgeMs?: number
  signal?: AbortSignal
}

export function isGeolocationSupported() {
  return (
    typeof navigator !== 'undefined' &&
    'geolocation' in navigator &&
    // Browsers refuse geolocation on plain HTTP, so treat it as unsupported up front.
    (typeof window === 'undefined' || window.isSecureContext !== false)
  )
}

export type GeolocationPermission = 'granted' | 'prompt' | 'denied' | 'unknown'

/**
 * Current permission without showing the browser prompt.
 * 'unknown' when the Permissions API is missing (older Safari, some in-app browsers).
 */
export async function getGeolocationPermission(): Promise<GeolocationPermission> {
  if (!isGeolocationSupported()) return 'unknown'
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unknown'
  }
}

function toCurrentPosition(position: GeolocationPosition): CurrentPosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  }
}

/**
 * Asks for the current position (this shows the permission prompt the first time).
 *
 * Phones often answer with a rough fix first and sharpen it over a few seconds, so this watches
 * the position: it resolves at once when a fix reaches `desiredAccuracyM`, otherwise with the
 * best fix seen when `timeoutMs` runs out. It always rejects with a GeolocationError.
 *
 * `timeoutMs` starts when the browser starts measuring, not while its permission prompt is open:
 * a first-time user may read the prompt for as long as it takes.
 */
export function getCurrentPosition(options: CurrentPositionOptions = {}): Promise<CurrentPosition> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    desiredAccuracyM = DEFAULT_DESIRED_ACCURACY_M,
    maxAccuracyM,
    maximumAgeMs = 0,
    signal,
  } = options

  if (!isGeolocationSupported()) return Promise.reject(new GeolocationError('UNSUPPORTED'))
  if (signal?.aborted) return Promise.reject(new GeolocationError('ABORTED'))

  return new Promise<CurrentPosition>((resolve, reject) => {
    let best: CurrentPosition | null = null
    let unavailable = false
    let settled = false
    let watchId: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let giveUpTimer: ReturnType<typeof setTimeout> | undefined

    const finish = (settle: () => void) => {
      if (settled) return
      settled = true
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId)
      clearTimeout(timer)
      clearTimeout(giveUpTimer)
      signal?.removeEventListener('abort', onAbort)
      settle()
    }

    const settleWithBest = () =>
      finish(() => {
        if (!best) {
          reject(new GeolocationError(unavailable ? 'POSITION_UNAVAILABLE' : 'TIMEOUT'))
        } else if (maxAccuracyM !== undefined && best.accuracy > maxAccuracyM) {
          reject(new GeolocationError('LOW_ACCURACY', best.accuracy))
        } else {
          resolve(best)
        }
      })

    // Our timer starts only when the browser is known to be measuring. Started up front it would
    // also count the time the permission prompt is open, and tapping "Allow" after it ran out
    // would do nothing.
    const armTimer = () => {
      if (settled || timer !== undefined) return
      timer = setTimeout(settleWithBest, timeoutMs)
    }

    function onAbort() {
      finish(() => reject(new GeolocationError('ABORTED')))
    }

    signal?.addEventListener('abort', onAbort)
    // Last resort for a browser that never answers (no prompt, no callback, e.g. some in-app
    // browsers): give up after a long wait instead of leaving the screen busy forever.
    giveUpTimer = setTimeout(settleWithBest, timeoutMs + PROMPT_GRACE_MS)

    // Called at once, before anything async: the prompt needs the user's tap.
    const id = navigator.geolocation.watchPosition(
      (position) => {
        // A fix means the permission is given.
        armTimer()
        const fix = toCurrentPosition(position)
        if (!best || fix.accuracy <= best.accuracy) best = fix
        if (fix.accuracy <= desiredAccuracyM) settleWithBest()
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish(() => reject(new GeolocationError('PERMISSION_DENIED')))
          return
        }
        // The browser's own timeout does not count the prompt time either, so the full wait is
        // over: settle now instead of waiting one more round.
        if (error.code === error.TIMEOUT) {
          settleWithBest()
          return
        }
        // "Unavailable" can be a passing state while the GPS warms up, so keep watching until
        // our timer ends and settle with whatever arrived by then.
        armTimer()
        if (error.code === error.POSITION_UNAVAILABLE) unavailable = true
      },
      { enableHighAccuracy: true, maximumAge: maximumAgeMs, timeout: timeoutMs },
    )
    // A callback may have settled the request before watchPosition returned its id.
    if (settled) navigator.geolocation.clearWatch(id)
    else watchId = id

    // Permission given on an earlier visit: no prompt opens, so the wait starts now. 'prompt'
    // and 'unknown' (no Permissions API) wait for the first callback instead.
    void getGeolocationPermission().then((permission) => {
      if (!settled && permission === 'granted') armTimer()
    })
  })
}
