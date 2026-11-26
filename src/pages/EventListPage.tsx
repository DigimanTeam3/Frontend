import { EventCard } from '@/features/events/components/EventCard'
import { useEventsQuery } from '@/features/events/api'
import { ja } from '@/shared/i18n/ja'

export function EventListPage() {
  const { data: events, isPending, isError } = useEventsQuery()

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">{ja.eventList.title}</h1>
      {isPending && <p className="text-ink-muted">{ja.common.loading}</p>}
      {isError && <p className="text-danger">{ja.common.error}</p>}
      {events?.length === 0 && <p className="text-ink-muted">{ja.eventList.empty}</p>}
      <ul className="flex flex-col gap-3">
        {events?.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  )
}
