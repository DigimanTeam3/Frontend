export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6_371_000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * Straight-line distance in meters between two points (haversine), rounded.
 * For display only ("会場まで 40m"). Whether a check-in is inside the venue radius is decided by the server.
 */
export function distanceMeters(from: LatLng, to: LatLng) {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)))
}
