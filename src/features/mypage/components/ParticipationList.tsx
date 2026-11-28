import { Link } from 'react-router'
import { useMyParticipationsQuery } from '@/features/mypage/api'
import { SectionError } from '@/features/mypage/components/SectionError'
import { SectionLoading } from '@/features/mypage/components/SectionLoading'
import { ja } from '@/shared/i18n/ja'
import { formatDateRange } from '@/shared/lib/formatDate'
import { isCheckedIn } from '@/shared/lib/participationStatus'
import { paths } from '@/shared/lib/paths'

// The events I took part in, under the menu row that opens it. Loads when it is first opened.
export function ParticipationList() {
  const { participations: copy } = ja.myPage
  const { data, isPending, isError, refetch } = useMyParticipationsQuery()

  return (
    <div className="border-b border-line px-1 py-3 pl-[38px]">
      {isPending && (
        <SectionLoading>
          <div className="flex flex-col gap-3">
            {[0, 1].map((item) => (
              <div key={item} className="h-10 rounded-md bg-ink/5" />
            ))}
          </div>
        </SectionLoading>
      )}
      {isError && <SectionError onRetry={() => void refetch()} />}
      {data && data.items.length === 0 && (
        <p className="text-[13px] leading-[1.6] text-ink-muted">{copy.empty}</p>
      )}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {data.items.map(({ participation, event }) => (
            <li key={participation.id}>
              <Link
                to={paths.eventDetail(event.id)}
                className="flex items-center gap-3 rounded-lg py-1.5"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    lang={event.titleJa === null ? 'ko' : undefined}
                    className="text-sm leading-normal font-bold break-words text-ink"
                  >
                    {event.titleJa ?? event.title}
                  </span>
                  <span className="text-xs leading-normal text-ink-muted">
                    {formatDateRange(event.startDate, event.endDate)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-[3px] text-xs leading-normal font-bold ${
                    isCheckedIn(participation.status)
                      ? 'bg-gate text-white'
                      : 'bg-ink/5 text-ink-muted'
                  }`}
                >
                  {isCheckedIn(participation.status) ? copy.verified : copy.unverified}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
