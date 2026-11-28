// Shared map settings (C6). Every map screen (S04 map, S05 detail, S09 check-in) uses these.

// OpenFreeMap "liberty": free, no API key, no usage limit. It includes a 3D building layer
// (fill-extrusion, zoom 14+). Its attribution is required and stays visible (see MapCanvas).
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

/** Central Seoul (City Hall). Used when there is nothing to fit the view to. */
export const SEOUL_CENTER = { latitude: 37.5665, longitude: 126.978 } as const

/** Keep panning inside the Seoul metro area: [west, south, east, north]. */
export const SEOUL_MAX_BOUNDS: [number, number, number, number] = [126.6, 37.35, 127.35, 37.8]

export const MAP_LIMITS = {
  minZoom: 9,
  maxZoom: 18,
  // Steeper pitch loads many more far-away tiles; 60° keeps phones smooth.
  maxPitch: 60,
} as const

/** Map land color, for MapLibre paint values. Same value as the --color-map-paper token. */
export const MAP_PAPER = '#efe8da'

/** 3D view used when opening a map on one place. */
export const VENUE_VIEW = { zoom: 15.5, pitch: 50, bearing: -20 } as const

// Phones with 3x screens would render 9x the pixels of 1x. 2x looks the same and is much cheaper.
export const mapPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2)
