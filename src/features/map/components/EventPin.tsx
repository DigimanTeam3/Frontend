import { Marker } from '@vis.gl/react-maplibre'
import { categoryLabel, preferJa } from '@/shared/lib/eventText'
import type { EventCategory, EventSummary } from '@/shared/types/event'

// Category print colors from Figma kippu/* (祭り festival, 展示 exhibit, 公演 stage).
const CATEGORY_TEXT: Record<EventCategory, string> = {
  festival: 'text-festival',
  exhibition: 'text-exhibit',
  performance: 'text-stage',
}
const PIN_BOX = 'flex min-h-11 min-w-11 flex-col items-center justify-end'

const CATEGORY_BAR: Record<EventCategory, string> = {
  festival: 'bg-festival',
  exhibition: 'bg-exhibit',
  performance: 'bg-stage',
}

export interface EventPinProps {
  /** Must have valid coordinates (filter with hasValidCoords first). */
  event: EventSummary
  selected?: boolean
  onSelect?: (event: EventSummary) => void
}

/**
 * A small ticket tag standing on the event's spot: category stripe and name, and the event
 * title when selected. HTML markers are fine for the demo's tens of events; hundreds would
 * need a symbol layer instead.
 */
export function EventPin({ event, selected = false, onSelect }: EventPinProps) {
  const title = preferJa(event.titleJa, event.title)
  const label = `${categoryLabel(event.category)} ${title}`
  const tag = (
    <>
      <span
        className={`flex origin-bottom items-stretch overflow-hidden rounded-[3px] bg-surface shadow-[0_2px_6px_rgb(30_34_48/0.25)] ring-1 transition-transform duration-200 ease-out ${
          selected ? 'scale-110 ring-ink' : 'ring-ink/15'
        }`}
      >
        <span aria-hidden className={`w-1 ${CATEGORY_BAR[event.category]}`} />
        <span
          className={`px-1.5 py-0.5 font-mincho text-[11px] leading-[1.5] font-bold ${CATEGORY_TEXT[event.category]}`}
        >
          {categoryLabel(event.category)}
        </span>
        {selected && (
          <span className="max-w-[140px] truncate border-l border-dashed border-line px-1.5 py-0.5 text-[11px] leading-[1.5] font-bold text-ink">
            {title}
          </span>
        )}
      </span>
      <span aria-hidden className="h-2 w-px bg-ink/60" />
      <span aria-hidden className="size-1.5 rounded-full bg-ink ring-2 ring-surface" />
    </>
  )

  return (
    <Marker
      latitude={event.lat}
      longitude={event.lng}
      anchor="bottom"
      style={{ zIndex: selected ? 2 : 1 }}
    >
      {onSelect ? (
        <button
          type="button"
          aria-label={label}
          aria-pressed={selected}
          onClick={(e) => {
            // Keep the tap from also reaching the map (which would clear the selection).
            e.stopPropagation()
            onSelect(event)
          }}
          className={PIN_BOX}
        >
          {tag}
        </button>
      ) : (
        // A still marker (e.g. VenueMap): nothing to press, so not a button.
        <span role="img" aria-label={label} className={PIN_BOX}>
          {tag}
        </span>
      )}
    </Marker>
  )
}
