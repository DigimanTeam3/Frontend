import { useCallback, useState } from 'react'

// Minimal "where am I" for the map button. Replace with the shared geolocation util (C7)
// when it lands; the states below match what the map needs to show.

export type PositionState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'unavailable' }

export function useCurrentPosition() {
  const [state, setState] = useState<PositionState>({ status: 'idle' })

  /** Asks for the position once. Resolves with the final state so the caller can react. */
  const locate = useCallback(
    () =>
      new Promise<PositionState>((resolve) => {
        const finish = (next: PositionState) => {
          setState(next)
          resolve(next)
        }
        if (!('geolocation' in navigator)) {
          finish({ status: 'unavailable' })
          return
        }
        setState({ status: 'locating' })
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            finish({ status: 'located', lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) =>
            finish({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
        )
      }),
    [],
  )

  return { state, locate }
}
