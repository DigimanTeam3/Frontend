import type { LngLatBoundsLike, Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { SEOUL_CENTER } from '@/features/map/config'
import { prefersReducedMotion } from '@/features/map/lib/maplibre'

// Camera moves for S04. Every move jumps instead of flies when the OS asks for less motion.

interface Spot {
  id: number
  lat: number
  lng: number
}

/** Where the camera starts: high above Seoul, looking straight down, before the first flight. */
export const DEPARTURE_VIEW = { ...SEOUL_CENTER, zoom: 10.6, pitch: 0, bearing: 0 } as const

const ARRIVAL = { zoom: 15.6, pitch: 58 } as const

/** The 2D mode looks straight down with north up; every move keeps it that way. */
const FLAT = { pitch: 0, bearing: 0 } as const

// Each destination gets its own slight heading, so flying between tickets feels like a turn.
const headingFor = (id: number) => -28 + ((id * 37) % 24)

const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms)

/** Flies to one event: a high arc across the city, landing tilted over the venue (flat in 2D). */
export function flyToSpot(
  map: MapLibreMap,
  spot: Spot,
  padding: PaddingOptions,
  { first = false, is3d = true } = {},
) {
  map.flyTo({
    center: [spot.lng, spot.lat],
    zoom: ARRIVAL.zoom,
    ...(is3d ? { pitch: ARRIVAL.pitch, bearing: headingFor(spot.id) } : FLAT),
    padding,
    // The first flight from the departure view is slower so the city can unfold.
    duration: duration(first ? 2800 : 1700),
    curve: first ? 1.6 : 1.42,
    essential: false,
  })
}

/** Shows every event at once, slightly tilted (flat in 2D). */
export function fitAll(
  map: MapLibreMap,
  bounds: LngLatBoundsLike,
  padding: PaddingOptions,
  { is3d = true } = {},
) {
  map.fitBounds(bounds, {
    padding,
    maxZoom: 14,
    ...(is3d ? { pitch: 40, bearing: -12 } : FLAT),
    duration: duration(1200),
  })
}

/** Moves to the user's position, keeping the current tilt. */
export function flyToUser(map: MapLibreMap, lat: number, lng: number, padding: PaddingOptions) {
  map.flyTo({ center: [lng, lat], zoom: 15, padding, duration: duration(1400) })
}

/** Flat map ↔ tilted 3D city. */
export function togglePitch(map: MapLibreMap, to3d: boolean) {
  map.easeTo({
    ...(to3d ? { pitch: ARRIVAL.pitch, bearing: map.getBearing() || -20 } : FLAT),
    duration: duration(600),
  })
}
