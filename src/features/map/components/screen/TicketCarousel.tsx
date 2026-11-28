import { useEffect, useRef } from 'react'
import { MapTicketCard } from '@/features/map/components/screen/MapTicketCard'
import { prefersReducedMotion } from '@/features/map/lib/maplibre'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/event'

const GAP = 12
// Browsers without `scrollend`: scrolling has settled when no scroll event came for this long.
const SETTLE_MS = 150

type MappedEvent = EventSummary & { lat: number; lng: number }

export interface TicketCarouselProps {
  events: MappedEvent[]
  selectedId: number | null
  /** Called when the user swipes another ticket to the center. */
  onSwipe: (eventId: number) => void
}

/** Horizontal snap carousel of tickets. Swiping one to the center selects it on the map. */
export function TicketCarousel({ events, selectedId, onSwipe }: TicketCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const selectedIndex = events.findIndex((e) => e.id === selectedId)
  // The settle handler outlives renders, so it reads the latest props from here.
  const latest = useRef({ events, selectedId, onSwipe })
  // True while the selection change came from the user's own swipe (no need to re-center).
  const fromSwipe = useRef(false)

  useEffect(() => {
    latest.current = { events, selectedId, onSwipe }
  }, [events, selectedId, onSwipe])

  // Keep the selected ticket centered when the selection comes from the map (pin tap, deep link,
  // filter). Skipped after a swipe so it never fights the user's finger.
  useEffect(() => {
    if (fromSwipe.current) {
      fromSwipe.current = false
      return
    }
    const list = listRef.current
    const card = list?.children[selectedIndex] as HTMLElement | undefined
    if (!list || !card) return
    const left = card.offsetLeft - (list.clientWidth - card.offsetWidth) / 2
    if (Math.abs(list.scrollLeft - left) < 2) return
    list.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [selectedIndex])

  // Select the centered ticket once scrolling (and snapping) has finished.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const settle = () => {
      const first = list.children[0] as HTMLElement | undefined
      const { events: current, selectedId: selected, onSwipe: swipe } = latest.current
      if (!first) return
      const index = Math.round(list.scrollLeft / (first.offsetWidth + GAP))
      const event = current[Math.min(Math.max(index, 0), current.length - 1)]
      if (event && event.id !== selected) {
        fromSwipe.current = true
        swipe(event.id)
      }
    }
    if ('onscrollend' in window) {
      list.addEventListener('scrollend', settle)
      return () => list.removeEventListener('scrollend', settle)
    }
    let timer: number | undefined
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, SETTLE_MS)
    }
    list.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      list.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <ul
      ref={listRef}
      aria-label={ja.map.carouselLabel}
      className="flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-8 pt-2 pb-3 [&::-webkit-scrollbar]:hidden"
    >
      {events.map((event, i) => (
        <li
          key={event.id}
          aria-current={event.id === selectedId ? 'true' : undefined}
          className="w-full shrink-0 snap-center"
        >
          <span className="sr-only">{ja.map.ticketPosition(i + 1, events.length)}</span>
          <MapTicketCard event={event} selected={event.id === selectedId} />
        </li>
      ))}
    </ul>
  )
}
