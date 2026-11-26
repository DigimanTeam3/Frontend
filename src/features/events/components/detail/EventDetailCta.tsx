import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'

// Fixed bottom bar: entrances to S07 (write a companion post) and S09 (arrival check).
// It sits over the tab bar on this screen, as in the Figma S05 frame.
export function EventDetailCta({ eventId }: { eventId: number }) {
  const t = ja.eventDetail

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] flex-col gap-2.5 border-t border-line bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <p className="flex items-center gap-1.5 text-xs/normal text-ink-muted">
        <span aria-hidden className="size-2 rounded-full bg-gate" />
        {t.checkInHint}
      </p>
      <div className="flex gap-2.5">
        <Link
          to={`/events/${eventId}/companions/new`}
          className="flex h-[52px] items-center justify-center rounded-[14px] border border-line bg-surface px-5 text-[15px] font-bold text-ink"
        >
          {t.writeRecruit}
        </Link>
        <Link
          to={`/events/${eventId}/check-in`}
          className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-gate px-5 text-[15px] font-bold text-surface"
        >
          {t.checkIn}
        </Link>
      </div>
    </div>
  )
}
