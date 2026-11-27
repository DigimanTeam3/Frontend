import type { LngLatBoundsLike } from 'maplibre-gl'

interface HasCoords {
  lat: number
  lng: number
}

/** Events without usable coordinates are left off the map (they still show in lists). */
export function hasValidCoords<T extends { lat: number | null; lng: number | null }>(
  item: T,
): item is T & HasCoords {
  const { lat, lng } = item
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

/** Smallest box around all points, or null when there are none. */
export function boundsOf(points: HasCoords[]): LngLatBoundsLike | null {
  if (points.length === 0) return null
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const { lat, lng } of points) {
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return [west, south, east, north]
}
