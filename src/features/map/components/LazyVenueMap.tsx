import { lazy, Suspense, useState } from 'react'
import type { VenueMapProps } from '@/features/map/components/VenueMap'
import { MapErrorBoundary } from '@/features/map/components/MapErrorBoundary'
import { ja } from '@/shared/i18n/ja'

// React.lazy keeps a failed import forever, so a retry needs a fresh lazy component.
const loadVenueMap = () =>
  lazy(() => import('@/features/map/components/VenueMap').then((m) => ({ default: m.VenueMap })))

/** VenueMap that downloads MapLibre (about 300 kB gzip) only when it is shown. */
export function LazyVenueMap(props: VenueMapProps) {
  const [VenueMap, setVenueMap] = useState(loadVenueMap)

  return (
    <MapErrorBoundary className={props.className} onRetry={() => setVenueMap(loadVenueMap)}>
      <Suspense
        fallback={
          <div className={`flex items-center justify-center bg-map-paper ${props.className ?? ''}`}>
            <p role="status" className="font-mono text-xs tracking-[0.14em] text-ink-muted">
              {ja.map.loading}
            </p>
          </div>
        }
      >
        <VenueMap {...props} />
      </Suspense>
    </MapErrorBoundary>
  )
}
