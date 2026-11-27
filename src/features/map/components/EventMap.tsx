import { NavigationControl, Popup, type MapRef } from '@vis.gl/react-maplibre'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useEventsQuery } from '@/features/events/api'
import { preferJa } from '@/features/events/lib/eventText'
import { SEOUL_CENTER } from '@/features/map/config'
import { DirectionsLink } from '@/features/map/components/DirectionsLink'
import { EventPin } from '@/features/map/components/EventPin'
import { MapCanvas } from '@/features/map/components/MapCanvas'
import { boundsOf, hasValidCoords } from '@/features/map/lib/coords'
import { prefersReducedMotion } from '@/features/map/lib/maplibre'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/event'

const INITIAL_VIEW = { ...SEOUL_CENTER, zoom: 12, pitch: 45, bearing: -20 }

/** All events on one 3D map, fitted to where they are. Tap a pin for a short card. */
export function EventMap() {
  const { data: events } = useEventsQuery()
  const mapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selected, setSelected] = useState<EventSummary | null>(null)
  const mapped = useMemo(() => (events ?? []).filter(hasValidCoords), [events])

  useEffect(() => {
    const bounds = boundsOf(mapped)
    if (!mapReady || !bounds) return
    mapRef.current?.fitBounds(bounds, {
      padding: 56,
      maxZoom: 15,
      pitch: 45,
      duration: prefersReducedMotion() ? 0 : 800,
    })
  }, [mapReady, mapped])

  return (
    <MapCanvas
      ref={mapRef}
      className="h-[60dvh] w-full rounded-2xl"
      initialViewState={INITIAL_VIEW}
      onLoad={() => setMapReady(true)}
      onClick={() => setSelected(null)}
    >
      <NavigationControl position="top-right" visualizePitch />
      {mapped.map((event) => (
        <EventPin
          key={event.id}
          event={event}
          selected={selected?.id === event.id}
          onSelect={setSelected}
        />
      ))}
      {selected && hasValidCoords(selected) && (
        <Popup
          latitude={selected.lat}
          longitude={selected.lng}
          anchor="top"
          closeButton={false}
          onClose={() => setSelected(null)}
        >
          <Link to={`/events/${selected.id}`} className="block font-bold text-ink">
            {preferJa(selected.titleJa, selected.title)}
          </Link>
          <p className="text-ink-muted">{preferJa(selected.venueNameJa, selected.venueName)}</p>
          <DirectionsLink
            lat={selected.lat}
            lng={selected.lng}
            className="mt-1 inline-block font-bold text-exhibit underline"
          >
            {ja.map.directions}
          </DirectionsLink>
        </Popup>
      )}
    </MapCanvas>
  )
}
