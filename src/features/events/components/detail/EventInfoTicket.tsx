import type { ReactNode } from 'react'
import { Link } from 'react-router'
import calendarIcon from '@/features/events/assets/calendar.svg'
import peopleIcon from '@/features/events/assets/people.svg'
import pinIcon from '@/features/events/assets/pin.svg'
import yenIcon from '@/features/events/assets/yen.svg'
import { formatEventPeriod } from '@/features/events/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import { directionsUrl } from '@/shared/lib/directionsUrl'
import type { EventDetail } from '@/shared/types/event'

interface InfoRowProps {
  icon: string
  label: string
  main: ReactNode
  sub?: ReactNode
}

function InfoRow({ icon, label, main, sub }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 border-b border-dashed border-line px-4 py-3.5 last:border-b-0">
      <img src={icon} alt="" width={20} height={20} className="shrink-0" />
      <dl className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-xs/normal text-ink-mute">{label}</dt>
        <dd className="text-[15px]/[1.65] font-bold text-ink">{main}</dd>
        {sub && <dd className="text-xs/normal text-ink-sub">{sub}</dd>}
      </dl>
    </div>
  )
}

export interface EventInfoTicketProps {
  event: EventDetail
  /** Picks the text to show: Japanese, or the original when the user asked for it. */
  pick: (jaText: string | null, original: string | null) => string | null
}

export function EventInfoTicket({ event, pick }: EventInfoTicketProps) {
  const t = ja.eventDetail
  const hours = pick(event.hoursJa, event.hours)
  const fee = event.isFree ? t.free : (pick(event.feeJa, event.fee) ?? '—')

  return (
    <div className="rounded-[14px] border border-line bg-surface">
      <InfoRow
        icon={calendarIcon}
        label={t.dateTime}
        main={formatEventPeriod(event.startDate, event.endDate)}
        sub={hours}
      />
      <InfoRow
        icon={pinIcon}
        label={t.place}
        main={pick(event.venueNameJa, event.venueName)}
        sub={
          <>
            {pick(event.addressJa, event.address)}
            {' · '}
            <a
              href={directionsUrl(event.lat, event.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-exhibit"
            >
              {t.openMap}
            </a>
          </>
        }
      />
      <InfoRow
        icon={yenIcon}
        label={t.fee}
        main={fee}
        sub={event.reservationRequired ? t.reservationRequired : t.noReservation}
      />
      <InfoRow
        icon={peopleIcon}
        label={t.howToJoin}
        main={pick(event.howToJoinJa, event.howToJoin) ?? t.howToJoinDefault}
        sub={
          <>
            {t.missionHint}
            {' · '}
            <Link to={`/events/${event.id}/missions`} className="font-bold text-exhibit">
              {t.openMissions}
            </Link>
          </>
        }
      />
    </div>
  )
}
