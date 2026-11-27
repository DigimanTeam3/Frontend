import type { ReactNode } from 'react'
import { directionsUrl, type TravelMode } from '@/shared/lib/directionsUrl'

export interface DirectionsLinkProps {
  lat: number
  lng: number
  travelMode?: TravelMode
  className?: string
  children: ReactNode
}

/** Opens Google Maps directions to the spot (the app if installed). No API key needed. */
export function DirectionsLink({ lat, lng, travelMode, className, children }: DirectionsLinkProps) {
  return (
    <a
      href={directionsUrl(lat, lng, travelMode)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}
