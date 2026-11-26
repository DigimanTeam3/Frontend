import { useParams } from 'react-router'
import { isNotFoundError, useEventDetailQuery } from '@/features/events/api'
import { EventDetailCta } from '@/features/events/components/detail/EventDetailCta'
import {
  EventDetailSkeleton,
  EventLoadError,
  EventNotFound,
} from '@/features/events/components/detail/EventDetailStates'
import { EventDetailView } from '@/features/events/components/detail/EventDetailView'

function parseEventId(value: string | undefined) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// S05. Event detail: info, schedule, place, fee, how to join, and entrances to S06/S07/S09/S11.
export function EventDetailPage() {
  const eventId = parseEventId(useParams().eventId)
  const { data: event, isPending, isError, error, refetch } = useEventDetailQuery(eventId)

  let content
  if (eventId === null || (isError && isNotFoundError(error))) content = <EventNotFound />
  else if (isError) content = <EventLoadError onRetry={() => void refetch()} />
  else if (isPending) content = <EventDetailSkeleton />
  else content = <EventDetailView event={event} />

  return (
    // Cancel RootLayout's main padding so the hero image reaches the screen edges.
    <div className="-mx-4 -my-6 min-h-dvh bg-bg">
      {content}
      {event && !isError && <EventDetailCta eventId={event.id} />}
    </div>
  )
}
