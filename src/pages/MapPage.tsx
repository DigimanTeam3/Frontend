import { EventMap } from '@/features/map/components/EventMap'
import { ja } from '@/shared/i18n/ja'

export function MapPage() {
  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">{ja.map.title}</h1>
      <EventMap />
    </section>
  )
}
