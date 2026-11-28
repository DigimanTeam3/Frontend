import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GeolocationError,
  getCurrentPosition,
  isGeolocationError,
  type CurrentPosition,
  type CurrentPositionOptions,
} from '@/shared/lib/geolocation'

export type CurrentPositionState =
  | { status: 'idle'; position: null; error: null }
  /** `position` keeps the last known fix while a new one is measured. */
  | { status: 'locating'; position: CurrentPosition | null; error: null }
  | { status: 'success'; position: CurrentPosition; error: null }
  | { status: 'error'; position: CurrentPosition | null; error: GeolocationError }

export type LocateResult =
  { position: CurrentPosition; error: null } | { position: null; error: GeolocationError }

const IDLE: CurrentPositionState = { status: 'idle', position: null, error: null }

/**
 * Current position as React state. Nothing is asked until `locate()` is called, so the
 * permission prompt only shows after the user taps something.
 *
 * `locate()` never throws: it resolves with `{ position }` or `{ error }`, and the same result
 * is in the returned state. A request cancelled by a newer `locate()` or by leaving the screen
 * resolves with error code 'ABORTED' and does not change the state.
 */
export function useCurrentPosition(defaults: Omit<CurrentPositionOptions, 'signal'> = {}) {
  const [state, setState] = useState<CurrentPositionState>(IDLE)
  const controllerRef = useRef<AbortController | null>(null)
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    defaultsRef.current = defaults
  })

  // Stop watching the position when the screen closes.
  useEffect(() => () => controllerRef.current?.abort(), [])

  const locate = useCallback(
    async (options: Omit<CurrentPositionOptions, 'signal'> = {}): Promise<LocateResult> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState((previous) => ({ status: 'locating', position: previous.position, error: null }))

      try {
        const position = await getCurrentPosition({
          ...defaultsRef.current,
          ...options,
          signal: controller.signal,
        })
        if (controller.signal.aborted)
          return { position: null, error: new GeolocationError('ABORTED') }
        setState({ status: 'success', position, error: null })
        return { position, error: null }
      } catch (caught) {
        const error = isGeolocationError(caught)
          ? caught
          : new GeolocationError('POSITION_UNAVAILABLE')
        if (error.code !== 'ABORTED' && !controller.signal.aborted) {
          setState((previous) => ({ status: 'error', position: previous.position, error }))
        }
        return { position: null, error }
      }
    },
    [],
  )

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setState(IDLE)
  }, [])

  return { ...state, locate, reset }
}
