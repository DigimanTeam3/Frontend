import { categoryLabel, eventStatus } from '@/features/events/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import type { EventCategory, EventDetail } from '@/shared/types/event'

const TAG_BASE = 'inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-xs/normal font-bold'

const CATEGORY_STYLE: Record<EventCategory, string> = {
  festival: 'bg-festival-soft text-festival',
  exhibition: 'bg-exhibit-soft text-exhibit',
  performance: 'border border-line bg-surface text-ink-muted',
}

const STATUS_STYLE = {
  upcoming: 'border border-line bg-surface text-ink-muted',
  ongoing: 'bg-warn-soft text-warn',
  ended: 'bg-line text-ink-faint',
} as const

export function EventTags({ event }: { event: EventDetail }) {
  const status = eventStatus(event.startDate, event.endDate)

  return (
    <ul className="flex flex-wrap gap-1.5">
      <li className={`${TAG_BASE} ${CATEGORY_STYLE[event.category]}`}>
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {categoryLabel(event.category)}
      </li>
      {event.isFree && (
        <li className={`${TAG_BASE} border border-line bg-surface text-ink`}>
          {ja.eventDetail.free}
        </li>
      )}
      <li className={`${TAG_BASE} ${STATUS_STYLE[status]}`}>{ja.eventDetail.status[status]}</li>
    </ul>
  )
}
