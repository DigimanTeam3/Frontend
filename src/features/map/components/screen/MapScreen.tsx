import type { MapRef } from '@vis.gl/react-maplibre'
import type { PaddingOptions } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { preferJa } from '@/features/events/lib/eventText'
import { useMapEventsQuery } from '@/features/map/api'
import locateIcon from '@/features/map/assets/locate.svg'
import overviewIcon from '@/features/map/assets/overview.svg'
import searchIcon from '@/features/map/assets/search.svg'
import { SEOUL_MAX_BOUNDS } from '@/features/map/config'
import { EventPin } from '@/features/map/components/EventPin'
import { MapCanvas } from '@/features/map/components/MapCanvas'
import { CategoryChips, type CategoryFilter } from '@/features/map/components/screen/CategoryChips'
import { MapFallbackList } from '@/features/map/components/screen/MapFallbackList'
import { TicketCarousel } from '@/features/map/components/screen/TicketCarousel'
import { UserLocationDot } from '@/features/map/components/screen/UserLocationDot'
import {
  DEPARTURE_VIEW,
  fitAll,
  flyToSpot,
  flyToUser,
  togglePitch,
} from '@/features/map/lib/camera'
import { boundsOf, hasValidCoords } from '@/features/map/lib/coords'
import { hasWebGL, prefersReducedMotion } from '@/features/map/lib/maplibre'
import { sortForMap } from '@/features/map/lib/ticketText'
import { useCurrentPosition } from '@/features/map/lib/useCurrentPosition'
import { ja } from '@/shared/i18n/ja'

// Keeps the destination in the open part of the map, clear of the top bar and the tickets.
const CAMERA_PADDING: PaddingOptions = { top: 140, bottom: 170, left: 32, right: 32 }
// Showing every pin: wider sides because a selected tag (with its title) is up to 180px wide.
const OVERVIEW_PADDING: PaddingOptions = { top: 170, bottom: 200, left: 96, right: 96 }

const NOTICE_MS = 4000

function insideSeoul(lat: number, lng: number) {
  const [west, south, east, north] = SEOUL_MAX_BOUNDS
  return lng >= west && lng <= east && lat >= south && lat <= north
}

function readEventParam(value: string | null) {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : null
}

/**
 * S04 3D map in the Concept 切符 direction. Opening the screen flies from high above Seoul
 * down to the first ticket's venue; swiping the tickets flies between venues.
 */
export function MapScreen() {
  const { data, isPending, isError, refetch, isRefetching } = useMapEventsQuery()
  const [searchParams, setSearchParams] = useSearchParams()
  const mapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [is3d, setIs3d] = useState(true)
  const [flyingTo, setFlyingTo] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; key: number } | null>(null)
  const hasFlown = useRef(false)
  const { state: position, locate } = useCurrentPosition()
  const [webglOk] = useState(hasWebGL)

  const mapped = useMemo(() => sortForMap((data ?? []).filter(hasValidCoords)), [data])
  const visible = useMemo(
    () => (filter === 'all' ? mapped : mapped.filter((e) => e.category === filter)),
    [mapped, filter],
  )
  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = {
      all: mapped.length,
      festival: 0,
      exhibition: 0,
      performance: 0,
    }
    for (const e of mapped) c[e.category] += 1
    return c
  }, [mapped])

  const deepLinkId = readEventParam(searchParams.get('event'))

  // Latest values for callbacks that outlive a render (carousel settle timer, map load).
  const mappedRef = useRef(mapped)
  const mapReadyRef = useRef(mapReady)
  const is3dRef = useRef(is3d)
  useEffect(() => {
    mappedRef.current = mapped
    mapReadyRef.current = mapReady
    is3dRef.current = is3d
  }, [mapped, mapReady, is3d])

  const flyTo = useCallback((eventId: number) => {
    const event = mappedRef.current.find((e) => e.id === eventId)
    const map = mapRef.current?.getMap()
    if (!event || !map) return
    flyToSpot(map, event, CAMERA_PADDING, { first: !hasFlown.current, is3d: is3dRef.current })
    hasFlown.current = true
    // Set after flyTo: starting a flight ends the previous one, whose moveend clears the label.
    // No label when moves are instant (reduced motion), since no moveend would follow.
    if (!prefersReducedMotion()) setFlyingTo(preferJa(event.venueNameJa, event.venueName))
  }, [])

  // Selection (and ?event=) does not wait for the map; the camera follows once the map is ready.
  const select = useCallback(
    (eventId: number) => {
      if (!mappedRef.current.some((e) => e.id === eventId)) return
      setSelectedId(eventId)
      if (mapReadyRef.current) flyTo(eventId)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('event', String(eventId))
          return next
        },
        { replace: true, preventScrollReset: true },
      )
    },
    [flyTo, setSearchParams],
  )

  // Pick a ticket when the events arrive (the linked one, else the first), and again when the
  // filter hides the selected one.
  useEffect(() => {
    if (visible.length === 0) return
    if (selectedId !== null && visible.some((e) => e.id === selectedId)) return
    const linked = selectedId === null && visible.find((e) => e.id === deepLinkId)
    select(linked ? linked.id : visible[0].id)
  }, [visible, selectedId, deepLinkId, select])

  // First flight: from the departure view to whatever is selected when the map becomes ready.
  useEffect(() => {
    if (mapReady && selectedId !== null && !hasFlown.current) flyTo(selectedId)
  }, [mapReady, selectedId, flyTo])

  // Short messages (location errors) disappear on their own.
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  const showNotice = (text: string) => setNotice({ text, key: Date.now() })

  // A failed refetch keeps showing the events already loaded; the error is only for no data.
  const listFailed = isError && !data

  if (!webglOk) {
    return (
      <MapFallbackList
        events={data ?? []}
        status={isPending ? 'loading' : listFailed ? 'error' : 'ready'}
        onRetry={() => void refetch()}
      />
    )
  }

  const showOverview = () => {
    const map = mapRef.current?.getMap()
    const bounds = boundsOf(visible)
    if (map && bounds) fitAll(map, bounds, OVERVIEW_PADDING, { is3d })
  }

  // Fly to the user's position, or explain why not.
  const goToCurrentPosition = async () => {
    const result = await locate()
    const map = mapRef.current?.getMap()
    if (result.status === 'denied') showNotice(ja.map.locationDenied)
    if (result.status === 'unavailable') showNotice(ja.map.locationUnavailable)
    if (result.status === 'located' && map) {
      if (insideSeoul(result.lat, result.lng)) {
        setNotice(null)
        flyToUser(map, result.lat, result.lng, CAMERA_PADDING)
      } else {
        showNotice(ja.map.locationOutside)
      }
    }
  }

  const toggle3d = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    togglePitch(map, !is3d)
    setIs3d(!is3d)
  }

  const status = isPending
    ? 'loading'
    : listFailed
      ? 'error'
      : mapped.length === 0
        ? 'empty'
        : visible.length === 0
          ? 'filtered-empty'
          : 'ready'

  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">{ja.map.title}</h1>
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <MapCanvas
            ref={mapRef}
            className="h-full w-full"
            initialViewState={DEPARTURE_VIEW}
            onLoad={() => setMapReady(true)}
            onMoveEnd={() => setFlyingTo(null)}
            onPitchEnd={(e) => setIs3d(e.viewState.pitch > 10)}
          >
            {visible.map((event) => (
              <EventPin
                key={event.id}
                event={event}
                selected={event.id === selectedId}
                onSelect={(e) => select(e.id)}
              />
            ))}
            {position.status === 'located' && (
              <UserLocationDot lat={position.lat} lng={position.lng} />
            )}
          </MapCanvas>
        </div>

        {/* Top: search entry and category chips, over a paper fade so they read on any map. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-app/90 via-app/50 to-transparent px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-6">
          <Link
            to="/search"
            className="pointer-events-auto flex min-h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-sm text-ink-muted shadow-[0_2px_10px_rgb(30_34_48/0.14)]"
          >
            <img src={searchIcon} alt="" width={20} height={20} />
            {ja.map.searchPlaceholder}
          </Link>
          <div className="pointer-events-auto mt-2.5">
            <CategoryChips value={filter} counts={counts} onChange={setFilter} />
          </div>
          <p
            aria-live="polite"
            className={`mx-auto mt-3 w-fit rounded-full bg-ink/85 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-surface transition-opacity duration-200 ${
              flyingTo ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {flyingTo && (
              <>
                <span aria-hidden>{ja.map.flyingTo} ▸ </span>
                <span className="font-sans font-bold tracking-normal">{flyingTo}</span>
              </>
            )}
          </p>
        </div>

        {/* Right: map buttons, above the tickets. */}
        <div className="absolute right-4 bottom-[178px] flex flex-col gap-2">
          <button
            type="button"
            onClick={toggle3d}
            aria-pressed={is3d}
            aria-label={ja.map.toggle3d}
            className="flex size-11 items-center justify-center rounded-full bg-surface font-mono text-xs font-bold text-ink shadow-[0_2px_10px_rgb(30_34_48/0.18)]"
          >
            {is3d ? ja.map.mode3d : ja.map.mode2d}
          </button>
          <button
            type="button"
            onClick={showOverview}
            aria-label={ja.map.overview}
            className="flex size-11 items-center justify-center rounded-full bg-surface shadow-[0_2px_10px_rgb(30_34_48/0.18)]"
          >
            <img src={overviewIcon} alt="" width={22} height={22} />
          </button>
          <button
            type="button"
            onClick={() => void goToCurrentPosition()}
            aria-label={ja.map.locate}
            aria-busy={position.status === 'locating'}
            className="flex size-11 items-center justify-center rounded-full bg-surface shadow-[0_2px_10px_rgb(30_34_48/0.18)]"
          >
            <img
              src={locateIcon}
              alt=""
              width={22}
              height={22}
              className={position.status === 'locating' ? 'motion-safe:animate-pulse' : ''}
            />
          </button>
        </div>

        {notice && (
          <p
            key={notice.key}
            role="alert"
            className="absolute inset-x-4 bottom-[178px] mr-14 rounded-[10px] bg-ink/90 px-3 py-2 text-xs leading-[1.6] text-surface"
          >
            {notice.text}
          </p>
        )}

        {/* Bottom: leaves room under the tickets for the map attribution line. */}
        <div className="absolute inset-x-0 bottom-[18px]">
          {status === 'ready' ? (
            <TicketCarousel events={visible} selectedId={selectedId} onSwipe={select} />
          ) : (
            <div className="px-4 pb-4">
              <div
                role={status === 'error' ? 'alert' : 'status'}
                className="flex min-h-[72px] items-center justify-between gap-3 rounded-[10px] bg-surface px-4 py-3 shadow-[0_8px_24px_rgb(30_34_48/0.18)]"
              >
                <p className="text-sm text-ink">
                  {status === 'loading' && ja.map.eventsLoading}
                  {status === 'error' && ja.map.eventsError}
                  {status === 'empty' && ja.map.eventsEmpty}
                  {status === 'filtered-empty' && ja.map.filterEmpty}
                </p>
                {status === 'error' && (
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isRefetching}
                    className="min-h-11 shrink-0 rounded-full border border-ink px-4 text-sm font-bold text-ink disabled:opacity-50"
                  >
                    {ja.map.retry}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
