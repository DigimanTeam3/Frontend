import 'maplibre-gl/dist/maplibre-gl.css'
import '@/features/map/map.css'
import { Map, type MapProps, type MapRef } from '@vis.gl/react-maplibre'
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { MAP_LIMITS, MAP_STYLE_URL, SEOUL_MAX_BOUNDS, mapPixelRatio } from '@/features/map/config'
import { applyKippuTheme } from '@/features/map/lib/kippuTheme'
import { hasWebGL } from '@/features/map/lib/maplibre'
import { ja } from '@/shared/i18n/ja'

// A slow network can stall the style or first tiles; after this the user gets a retry button.
const LOAD_TIMEOUT_MS = 20_000

// Japanese text for MapLibre's own controls, aria labels and gesture hints (keys from its default_locale).
const c = ja.map.controls
const MAP_LOCALE: Record<string, string> = {
  'Map.Title': c.mapTitle,
  'Marker.Title': c.markerTitle,
  'Popup.Close': c.popupClose,
  'NavigationControl.ZoomIn': c.zoomIn,
  'NavigationControl.ZoomOut': c.zoomOut,
  'NavigationControl.ResetBearing': c.resetBearing,
  'AttributionControl.ToggleAttribution': c.toggleAttribution,
  'AttributionControl.MapFeedback': c.mapFeedback,
  'LogoControl.Title': c.logoTitle,
  'GeolocateControl.FindMyLocation': c.findMyLocation,
  'GeolocateControl.LocationNotAvailable': c.locationNotAvailable,
  'CooperativeGesturesHandler.WindowsHelpText': c.ctrlScrollHelp,
  'CooperativeGesturesHandler.MacHelpText': c.cmdScrollHelp,
  'CooperativeGesturesHandler.MobileHelpText': c.twoFingerHelp,
}

type LoadStatus = 'loading' | 'ready' | 'error'

export interface MapCanvasProps extends Omit<MapProps, 'mapStyle' | 'style' | 'id'> {
  /** Size and shape of the map box. The map fills it. */
  className?: string
  /** Shown instead of the map when the device has no WebGL. Defaults to a short notice. */
  fallback?: ReactNode
  ref?: Ref<MapRef>
}

/**
 * The one MapLibre setup every map screen shares: OpenFreeMap tiles in the 切符 palette with
 * Japanese labels, Seoul bounds, phone-friendly limits, the attribution 「ⓘ」 button, and the
 * loading / failed / no-WebGL states. Screens put markers and controls inside as children.
 */
export function MapCanvas({
  className = '',
  fallback,
  ref,
  onLoad,
  onError,
  onData,
  children,
  ...mapProps
}: MapCanvasProps) {
  const [webglOk] = useState(hasWebGL)
  const [status, setStatus] = useState<LoadStatus>('loading')
  // Changing the key remounts the map, which is how "retry" starts over.
  const [attempt, setAttempt] = useState(0)
  const styleLoaded = useRef(false)

  useEffect(() => {
    if (status !== 'loading') return
    const timer = window.setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [status, attempt])

  if (!webglOk) {
    return (
      fallback ?? (
        <div className={`flex items-center justify-center bg-surface p-6 ${className}`}>
          <p className="text-center text-sm text-ink-muted">{ja.map.unsupported}</p>
        </div>
      )
    )
  }

  const retry = () => {
    styleLoaded.current = false
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  return (
    // `isolate` keeps markers, controls and the overlays below inside the map box, so screens can
    // put their own UI on top of the map without z-index fights.
    <div className={`kippu-map relative isolate overflow-hidden bg-map-paper ${className}`}>
      <Map
        key={attempt}
        mapStyle={MAP_STYLE_URL}
        style={{ position: 'absolute', inset: 0 }}
        minZoom={MAP_LIMITS.minZoom}
        maxZoom={MAP_LIMITS.maxZoom}
        maxPitch={MAP_LIMITS.maxPitch}
        maxBounds={SEOUL_MAX_BOUNDS}
        pixelRatio={mapPixelRatio()}
        // Shown open on load, folded into the 「ⓘ」 button once the map is moved (tap to open again).
        attributionControl={{ compact: true }}
        locale={MAP_LOCALE}
        // Japanese and Korean glyphs come from the phone's own fonts (no big font downloads).
        localIdeographFontFamily="'Hiragino Sans', 'IBM Plex Sans JP', 'Noto Sans JP', sans-serif"
        dragRotate
        touchPitch
        {...mapProps}
        onData={(e) => {
          if (e.dataType === 'style') styleLoaded.current = true
          onData?.(e)
        }}
        onLoad={(e) => {
          applyKippuTheme(e.target)
          setStatus('ready')
          onLoad?.(e)
        }}
        onError={(e) => {
          // A single missing tile is harmless; only a style that never arrived is fatal.
          if (!styleLoaded.current) setStatus('error')
          onError?.(e)
        }}
        ref={ref}
      >
        {children}
      </Map>

      {/* Covers the default style until the 切符 colors are applied, so there is no color flash. */}
      <div
        aria-hidden={status !== 'loading'}
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-map-paper transition-opacity duration-300 ease-out ${
          status === 'loading' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {status === 'loading' && (
          <p role="status" className="font-mono text-xs tracking-[0.14em] text-ink-muted">
            {ja.map.loading}
          </p>
        )}
      </div>

      {status === 'error' && (
        <div
          role="alert"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center"
        >
          <p className="text-sm text-ink">{ja.map.loadFailed}</p>
          <button
            type="button"
            onClick={retry}
            className="min-h-11 rounded-full border border-ink px-5 text-sm font-bold text-ink"
          >
            {ja.map.retry}
          </button>
        </div>
      )}
    </div>
  )
}
