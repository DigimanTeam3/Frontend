import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'

// Repaints the OpenFreeMap "liberty" style in the Concept 切符 palette (ticket paper and print ink)
// and switches labels to Japanese. Runs once after the style loads; only paint/layout values change,
// so it costs nothing per frame. Layers are matched by type and source layer, not only by id,
// so a style update that renames a layer only loses a color, never breaks the map.

type PaintName = Parameters<MapLibreMap['setPaintProperty']>[1]
type PaintValue = Parameters<MapLibreMap['setPaintProperty']>[2]

const PAPER = {
  land: '#efe8da',
  landuse: '#ebe3d4',
  park: '#dfe9cf', // kippu/stage-paper
  water: '#cddfeb', // a little deeper than kippu/exhibit-paper so rivers read
  road: '#fbf8f1',
  roadMajor: '#f7e6cf',
  casing: '#d8ccb4', // kippu/rule, lighter
  rail: '#b8ac95',
  building: '#e2d8c4',
  ink: '#1e2230', // kippu/ink
  inkSub: '#5b6070', // kippu/ink-sub
  halo: '#f6f0e4', // kippu/paper
} as const

// Japanese name first, then the romanized name, then the original (Korean).
const JA_LABEL: ExpressionSpecification = [
  'coalesce',
  ['get', 'name:ja'],
  ['get', 'name:latin'],
  ['get', 'name'],
]

// Shops, restaurants and road shields compete with event pins. Stations (poi_transit) stay.
const HIDDEN_LAYERS =
  /^(poi_r\d+|road_one_way_arrow.*|highway-shield.*|road_shield.*|natural_earth)$/

function paintFor(id: string, type: string, sourceLayer: string): Record<string, PaintValue> {
  if (type === 'background') return { 'background-color': PAPER.land }
  if (type === 'fill-extrusion') {
    return {
      // Taller buildings get lighter, like stacked paper catching the light.
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'render_height'], 0],
        0,
        '#e3d8c3',
        60,
        '#efe7d8',
        200,
        '#f7f2e8',
      ],
      'fill-extrusion-opacity': 0.92,
    }
  }
  if (type === 'fill') {
    if (sourceLayer === 'water') return { 'fill-color': PAPER.water }
    if (sourceLayer === 'park' || /grass|wood|wetland/.test(id)) {
      return { 'fill-color': PAPER.park, 'fill-opacity': 0.8, 'fill-outline-color': PAPER.park }
    }
    if (sourceLayer === 'building') {
      return { 'fill-color': PAPER.building, 'fill-outline-color': PAPER.casing }
    }
    if (sourceLayer === 'landuse' || sourceLayer === 'landcover') {
      return { 'fill-color': PAPER.landuse }
    }
    return {}
  }
  if (type === 'line') {
    if (sourceLayer === 'waterway') return { 'line-color': PAPER.water }
    if (sourceLayer === 'park') return { 'line-color': PAPER.park }
    if (sourceLayer === 'boundary') return { 'line-color': PAPER.casing }
    if (sourceLayer !== 'transportation') return {}
    if (/rail/.test(id)) return { 'line-color': PAPER.rail }
    if (/casing/.test(id)) return { 'line-color': PAPER.casing }
    if (/motorway|trunk_primary/.test(id)) return { 'line-color': PAPER.roadMajor }
    return { 'line-color': PAPER.road }
  }
  if (type === 'symbol') {
    const isPlace = sourceLayer === 'place' || sourceLayer === 'water_name'
    return {
      'text-color': isPlace ? PAPER.ink : PAPER.inkSub,
      'text-halo-color': PAPER.halo,
      'text-halo-width': 1.2,
    }
  }
  return {}
}

export function applyKippuTheme(map: MapLibreMap) {
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    try {
      if (HIDDEN_LAYERS.test(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
        continue
      }
      const sourceLayer = 'source-layer' in layer ? (layer['source-layer'] ?? '') : ''
      for (const [name, value] of Object.entries(paintFor(layer.id, layer.type, sourceLayer))) {
        map.setPaintProperty(layer.id, name as PaintName, value)
      }
      if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field') !== undefined) {
        map.setLayoutProperty(layer.id, 'text-field', JA_LABEL)
      }
    } catch {
      // A layer this theme does not know keeps the original look.
    }
  }
  // Warm light from the upper left so 3D buildings read as paper blocks.
  map.setLight({ anchor: 'viewport', color: '#fff6e6', intensity: 0.35, position: [1.2, 210, 30] })
}
