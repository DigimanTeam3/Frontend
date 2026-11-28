import 'maplibre-gl/dist/maplibre-gl.css'
import { Map, Marker, NavigationControl, Popup } from '@vis.gl/react-maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useState } from 'react'
import { useEventsQuery } from '@/features/events/api'
import { ja } from '@/shared/i18n/ja'
import { directionsUrl } from '@/shared/lib/directionsUrl'
import type { EventSummary } from '@/shared/types/event'

// maplibre-gl 6 finds its worker next to its own file, which Vite moves.
// Point it at the worker file Vite emits instead.
setWorkerUrl(workerUrl)

// OpenFreeMap "liberty" already includes a 3D building layer (fill-extrusion, zoom 14+).
// Attribution is required by the tile terms; MapLibre adds it from the style automatically.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// Sinchon station area
const INITIAL_VIEW = { latitude: 37.5552, longitude: 126.9369, zoom: 16, pitch: 60, bearing: -20 }

function hasWebGL() {
  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
}

export function EventMap() {
  const { data: events = [] } = useEventsQuery()
  const [selected, setSelected] = useState<EventSummary | null>(null)
  const [webglOk] = useState(hasWebGL)

  if (!webglOk) return <p className="text-ink-muted">{ja.map.unsupported}</p>

  return (
    <div className="h-[60dvh] w-full overflow-hidden rounded-2xl">
      <Map
        initialViewState={INITIAL_VIEW}
        mapStyle={MAP_STYLE}
        maxPitch={70}
        canvasContextAttributes={{ antialias: true }}
      >
        <NavigationControl position="top-right" visualizePitch />
        {events.map((event) => (
          <Marker
            key={event.id}
            latitude={event.lat}
            longitude={event.lng}
            anchor="bottom"
            color="#e4572e"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelected(event)
            }}
          />
        ))}
        {selected && (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="top"
            onClose={() => setSelected(null)}
          >
            <p className="font-bold">{selected.titleJa ?? selected.title}</p>
            <p className="text-ink-muted">{selected.venueNameJa ?? selected.venueName}</p>
            <a
              className="mt-1 inline-block text-primary underline"
              href={directionsUrl(selected.lat, selected.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ja.map.directions}
            </a>
          </Popup>
        )}
      </Map>
    </div>
  )
}
