import { useState } from 'react'
import { ja } from '@/shared/i18n/ja'
import { formatDateRange } from '@/shared/lib/formatDate'
import type { EventBrief } from '@/shared/types/eventBrief'
import lanternPhoto from '@/shared/ui/assets/ticket-lantern.svg'

export interface MatchedEventCardProps {
  event: EventBrief
}

// The new event that matched the saved condition: picture, title, dates and place.
export function MatchedEventCard({ event }: MatchedEventCardProps) {
  // A photo URL that does not load falls back to the lantern picture too.
  const [photoFailed, setPhotoFailed] = useState(false)
  const photo = event.imageUrl && !photoFailed ? event.imageUrl : lanternPhoto

  return (
    <article
      aria-label={ja.notification.eventCardLabel}
      className="overflow-hidden rounded-[14px] border border-line bg-surface"
    >
      <img
        src={photo}
        alt=""
        draggable={false}
        onError={() => setPhotoFailed(true)}
        className="h-36 w-full object-cover"
      />
      <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
        <h2
          lang={event.titleJa === null ? 'ko' : undefined}
          className="text-[18px] leading-[1.45] font-bold break-words text-ink"
        >
          {event.titleJa ?? event.title}
        </h2>
        <p className="text-[13px] leading-[1.6] text-ink-muted">
          {formatDateRange(event.startDate, event.endDate)}
        </p>
        <p
          lang={event.venueNameJa === null ? 'ko' : undefined}
          className="text-[13px] leading-[1.6] break-words text-ink-muted"
        >
          {event.venueNameJa ?? event.venueName}
        </p>
      </div>
    </article>
  )
}
