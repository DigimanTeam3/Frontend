import { lazy, Suspense } from 'react'
import type { VenueMapProps } from '@/features/map/components/VenueMap'
import { ja } from '@/shared/i18n/ja'

const VenueMap = lazy(() => import('@/features/map/components/VenueMap'))

/** VenueMap that downloads MapLibre (about 300 kB gzip) only when it is shown. */
export function LazyVenueMap(props: VenueMapProps) {
  return (
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
  )
}
