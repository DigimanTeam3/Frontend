import { Link, useNavigate } from 'react-router'
import { MissionItem } from '@/features/mission/components/MissionItem'
import { MissionProgressCard } from '@/features/mission/components/MissionProgressCard'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import type { MissionListResponse } from '@/shared/types/mission'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { State } from '@/shared/ui/State'

export interface MissionListProps {
  event: JourneyEvent
  data: MissionListResponse
}

// The loaded mission list (Figma: S11 ミッション一覧): progress card, the rows, and the way on to
// the experience card once every required mission is done.
export function MissionList({ event, data }: MissionListProps) {
  const navigate = useNavigate()
  const { mission: copy } = ja
  const { isVerified, requiredCount, myCompletedRequiredCount } = data

  if (data.items.length === 0) {
    return (
      <State
        kind="empty"
        className="my-auto"
        title={copy.empty.title}
        body={copy.empty.body}
        action={{ label: copy.empty.action, onClick: () => navigate(paths.eventDetail(event.id)) }}
      />
    )
  }

  const missions = data.items.toSorted((a, b) => a.sortOrder - b.sortOrder)
  const requiredMissions = missions.filter((mission) => mission.required)
  const allDone = isVerified && requiredCount > 0 && myCompletedRequiredCount >= requiredCount

  return (
    <>
      <div className="flex flex-col gap-4">
        <MissionProgressCard
          event={event}
          requiredMissions={requiredMissions}
          completedCount={myCompletedRequiredCount}
          requiredCount={requiredCount}
          isVerified={isVerified}
        />

        {!isVerified && (
          <div className="bg-gate/15 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[14px] p-3.5">
            <p className="min-w-0 flex-1 basis-40 text-[13px] leading-[1.6] text-ink">
              {copy.notVerified.body}
            </p>
            <Link
              to={paths.checkIn(event.id)}
              className={buttonClassName({ variant: 'accent', size: 'sm' })}
            >
              {copy.notVerified.action}
            </Link>
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {missions.map((mission) => (
            <li key={mission.id}>
              <MissionItem mission={mission} locked={!isVerified} />
            </li>
          ))}
        </ul>
      </div>

      {allDone && (
        <div className="mt-auto pt-6">
          <Link
            to={paths.complete(event.id)}
            className={buttonClassName({ variant: 'primary', fullWidth: true })}
          >
            {copy.viewCard}
          </Link>
        </div>
      )}
    </>
  )
}
