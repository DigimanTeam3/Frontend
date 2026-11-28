import { useCallback, useMemo } from 'react'
import { useCurrentPosition } from '@/shared/lib/useCurrentPosition'

// Current position for the 近い順 sort, from the shared geolocation hook (C7).
// Rounded to ~10 m: enough for "nearest first", less precise to send.
const round = (value: number) => Math.round(value * 10_000) / 10_000

export function useSearchPosition() {
  const { status, position, locate } = useCurrentPosition({
    desiredAccuracyM: 1_000,
    maximumAgeMs: 60_000,
  })
  const rounded = useMemo(
    () => (position ? { lat: round(position.lat), lng: round(position.lng) } : null),
    [position],
  )

  /** Asks once. True when a position came back, or when a newer ask cancelled this one. */
  const ask = useCallback(async () => {
    const result = await locate()
    return result.position !== null || result.error.code === 'ABORTED'
  }, [locate])

  return { position: rounded, locating: status === 'locating', ask }
}
