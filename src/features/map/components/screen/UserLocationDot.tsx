import { Marker } from '@vis.gl/react-maplibre'
import { ja } from '@/shared/i18n/ja'

/** The user's position: a blue dot with a soft pulse (no pulse with reduced motion). */
export function UserLocationDot({ lat, lng }: { lat: number; lng: number }) {
  return (
    <Marker latitude={lat} longitude={lng} anchor="center" style={{ zIndex: 3 }}>
      <span role="img" aria-label={ja.map.youAreHere} className="relative flex size-5">
        <span className="absolute inset-0 rounded-full bg-exhibit/30 motion-safe:animate-ping" />
        <span className="relative m-auto size-3.5 rounded-full bg-exhibit ring-[3px] ring-surface" />
      </span>
    </Marker>
  )
}
