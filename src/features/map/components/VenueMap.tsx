import { NavigationControl } from '@vis.gl/react-maplibre'
import { VENUE_VIEW } from '@/features/map/config'
import { EventPin } from '@/features/map/components/EventPin'
import { MapCanvas } from '@/features/map/components/MapCanvas'
import { hasValidCoords } from '@/features/map/lib/coords'
import type { EventSummary } from '@/shared/types/event'

export interface VenueMapProps {
  event: EventSummary
  /** Height and shape of the map box, e.g. "h-[330px] rounded-[14px]". */
  className?: string
  /** false: a still picture of the spot (no panning), for maps inside scrolling screens. */
  interactive?: boolean
}

/**
 * One venue in 3D (S05 detail, S09 check-in). Loads MapLibre, so import it through
 * LazyVenueMap to keep the map code out of the screen's first load.
 */
export function VenueMap({ event, className = '', interactive = false }: VenueMapProps) {
  if (!hasValidCoords(event)) return null

  return (
    <MapCanvas
      className={className}
      initialViewState={{ latitude: event.lat, longitude: event.lng, ...VENUE_VIEW }}
      interactive={interactive}
      cooperativeGestures={interactive}
    >
      {interactive && <NavigationControl position="top-right" showCompass={false} />}
      <EventPin event={event} selected />
    </MapCanvas>
  )
}
