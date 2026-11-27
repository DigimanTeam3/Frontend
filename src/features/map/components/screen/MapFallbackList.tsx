import { EventCard } from '@/features/events/components/EventCard'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/event'

export interface MapFallbackListProps {
  events: EventSummary[]
  status: 'loading' | 'error' | 'ready'
  onRetry: () => void
}

/** No WebGL: the same events as a plain list, so the screen still works. */
export function MapFallbackList({ events, status, onRetry }: MapFallbackListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 bg-app px-gutter pt-[calc(env(safe-area-inset-top)+16px)] pb-6">
      <h1 className="text-xl font-bold">{ja.map.title}</h1>
      <p role="status" className="rounded-[10px] bg-warn-soft p-3 text-sm text-warn">
        {ja.map.unsupportedList}
      </p>
      {status === 'loading' && <p className="text-sm text-ink-muted">{ja.map.eventsLoading}</p>}
      {status === 'error' && (
        <div role="alert" className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">{ja.map.eventsError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 shrink-0 rounded-full border border-ink px-4 text-sm font-bold text-ink"
          >
            {ja.map.retry}
          </button>
        </div>
      )}
      {status === 'ready' && events.length === 0 && (
        <p className="text-sm text-ink-muted">{ja.map.eventsEmpty}</p>
      )}
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </div>
  )
}
