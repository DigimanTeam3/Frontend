import { useState } from 'react'
import { Link } from 'react-router'
import { MissionHeader } from '@/features/mission/components/MissionHeader'
import { ja } from '@/shared/i18n/ja'
import { formatDate } from '@/shared/lib/formatDate'
import { paths } from '@/shared/lib/paths'
import type { Mission, Submission } from '@/shared/types/mission'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { CheckIcon } from '@/shared/ui/icons/CheckIcon'

export interface MissionSubmittedProps {
  mission: Mission
  /** Place of the mission in the event's list, starting at 1. */
  position: number
  submission: Submission
}

const LABEL = 'text-xs leading-normal font-bold text-ink-muted'

// Read-only view of a mission I already submitted: what I sent, without the form.
export function MissionSubmitted({ mission, position, submission }: MissionSubmittedProps) {
  const { missionSubmit: copy } = ja
  // A photo URL that no longer loads leaves the quiet tile instead of a broken image.
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-5">
        <MissionHeader mission={mission} position={position} />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="bg-gate/15 text-gate flex size-7 shrink-0 items-center justify-center rounded-full">
            <CheckIcon className="size-4" />
          </span>
          <span className="text-gate text-base leading-normal font-bold">
            {copy.submitted.done}
          </span>
          <span className="text-xs leading-normal text-ink-muted">
            {copy.submitted.date(formatDate(submission.submittedAt))}
          </span>
        </p>

        {submission.image && (
          <div className="flex flex-col gap-2">
            <p className={LABEL}>{copy.photoLabel}</p>
            {/* Same tile as the uploader (104px, cover crop), without the remove button. */}
            <div className="size-[104px] overflow-hidden rounded-[14px] bg-ink/5">
              {!photoFailed && (
                <img
                  src={submission.image}
                  alt={copy.submitted.photoAlt}
                  onError={() => setPhotoFailed(true)}
                  className="size-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {submission.text && (
          <div className="flex flex-col gap-1.5">
            <p className={LABEL}>{copy.textLabel}</p>
            <p className="rounded-[10px] bg-ink/5 px-3.5 py-3 text-[15px] leading-[1.65] break-words whitespace-pre-wrap text-ink">
              {submission.text}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Link
          to={paths.missions(mission.eventId)}
          className={buttonClassName({ variant: 'primary', fullWidth: true })}
        >
          {copy.submitted.backToList}
        </Link>
      </div>
    </>
  )
}
