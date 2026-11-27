import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import type { Mission } from '@/shared/types/mission'
import { CheckIcon } from '@/shared/ui/icons/CheckIcon'
import { ChevronRightIcon } from '@/shared/ui/icons/ChevronRightIcon'
import { FlagIcon } from '@/shared/ui/icons/FlagIcon'
import { LockIcon } from '@/shared/ui/icons/LockIcon'

export interface MissionItemProps {
  mission: Mission
  /** My check-in has not passed yet: the row is shown locked and cannot be opened. */
  locked: boolean
}

const ROW = 'flex items-center gap-3 rounded-[14px] border p-3.5'

// One mission row (Figma: MissionItem). Three states: locked (before the check-in), todo and
// done. A submission is approved at once, so there is no "in review" state.
export function MissionItem({ mission, locked }: MissionItemProps) {
  const { status } = ja.mission
  const done = mission.mySubmission !== null
  const title = mission.titleJa ?? mission.title

  let statusText: string = status.locked
  if (!locked) {
    if (done) statusText = mission.required ? status.done : status.doneOptional
    else statusText = mission.required ? status.todo : status.todoOptional
  }

  const content = (
    <>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          locked ? 'text-ink-faint' : done ? 'bg-gate/15 text-gate' : 'bg-ink/5 text-ink'
        }`}
      >
        {locked ? <LockIcon /> : done ? <CheckIcon /> : <FlagIcon />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span
            lang={mission.titleJa === null ? 'ko' : undefined}
            className={`min-w-0 truncate text-base leading-normal font-bold ${
              locked ? 'text-ink-faint' : 'text-ink'
            }`}
          >
            {title}
          </span>
          {mission.required && (
            <span className="border-festival text-festival shrink-0 rounded-md border px-[5px] py-px text-xs leading-normal font-bold">
              {ja.mission.required}
            </span>
          )}
        </span>
        <span
          className={`text-xs leading-normal ${
            locked ? 'text-ink-faint' : done ? 'text-gate' : 'text-ink-muted'
          }`}
        >
          {statusText}
        </span>
      </span>
      {!locked && !done && <ChevronRightIcon className="text-ink-faint size-5 shrink-0" />}
    </>
  )

  if (locked) {
    // Same height as the bordered rows, but the border is not visible.
    return <div className={`${ROW} border-transparent bg-ink/5`}>{content}</div>
  }
  // A done row opens the same screen, which then shows what I sent.
  return (
    <Link
      to={paths.missionSubmit(mission.eventId, mission.id)}
      className={`${ROW} border-line bg-surface`}
    >
      {content}
    </Link>
  )
}
