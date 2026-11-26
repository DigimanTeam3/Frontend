import { useCallback, useState } from 'react'

// Current position for the 近い順 sort. Kept small on purpose: the shared geolocation helper (C7)
// replaces this once it lands. Rounded to ~10 m: enough for "nearest first", less precise to send.
export type PositionState =
  | { status: 'idle' | 'locating' | 'unavailable'; position: null }
  | { status: 'ready'; position: { lat: number; lng: number } }

const round = (value: number) => Math.round(value * 10_000) / 10_000
const hasGeolocation = () => typeof navigator !== 'undefined' && 'geolocation' in navigator

/** @param startLocating true when the screen opens already sorted by distance. */
export function useCurrentPosition(startLocating = false) {
  const [state, setState] = useState<PositionState>(() => ({
    status: !startLocating ? 'idle' : hasGeolocation() ? 'locating' : 'unavailable',
    position: null,
  }))

  /** Asks the browser for the position. State changes only when the answer comes back. */
  const request = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (!hasGeolocation()) {
          resolve(false)
          return
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            setState({
              status: 'ready',
              position: { lat: round(coords.latitude), lng: round(coords.longitude) },
            })
            resolve(true)
          },
          () => {
            setState({ status: 'unavailable', position: null })
            resolve(false)
          },
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
        )
      }),
    [],
  )

  /** For a tap: shows "locating" right away, then asks. */
  const locate = useCallback(() => {
    setState(
      hasGeolocation()
        ? { status: 'locating', position: null }
        : { status: 'unavailable', position: null },
    )
    return request()
  }, [request])

  return { ...state, request, locate }
}
