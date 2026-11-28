import { ja } from '@/shared/i18n/ja'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import type { Mission } from '@/shared/types/mission'
import { CheckIcon } from '@/shared/ui/icons/CheckIcon'

export interface MissionProgressCardProps {
  event: JourneyEvent
  /** The required missions only, in sortOrder: only they lead to the completion badge. */
  requiredMissions: Mission[]
  /** myCompletedRequiredCount / requiredCount of the API answer. */
  completedCount: number
  requiredCount: number
  isVerified: boolean
}

// Paper card at the top of the list (Figma: S11 progress card): event name, one punch circle per
// required mission, the count and a hint.
export function MissionProgressCard({
  event,
  requiredMissions,
  completedCount,
  requiredCount,
  isVerified,
}: MissionProgressCardProps) {
  const { mission: copy } = ja
  const allDone = requiredCount > 0 && completedCount >= requiredCount

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-paper p-[18px]">
      <div className="flex items-center gap-2">
        <p
          lang={event.titleJa === null ? 'ko' : undefined}
          className="min-w-0 flex-1 truncate text-base leading-normal font-bold text-ink"
        >
          {event.titleJa ?? event.title}
        </p>
        {isVerified && (
          <span className="shrink-0 rounded-md bg-gate px-2 py-[3px] text-xs leading-normal font-bold text-white">
            {copy.verifiedTag}
          </span>
        )}
      </div>

      {requiredMissions.length > 0 && (
        <div
          role="img"
          aria-label={copy.progressLabel(completedCount, requiredCount)}
          className="flex items-center gap-2.5"
        >
          {/* The circles shrink together when there are many required missions. */}
          <div aria-hidden="true" className="flex min-w-0 items-center gap-2.5">
            {requiredMissions.map((mission, index) =>
              mission.mySubmission ? (
                <span
                  key={mission.id}
                  className="flex aspect-square w-11 min-w-0 shrink items-center justify-center rounded-full bg-gate text-white"
                >
                  <CheckIcon />
                </span>
              ) : (
                <span
                  key={mission.id}
                  className="flex aspect-square w-11 min-w-0 shrink items-center justify-center rounded-full border border-dashed border-ink-faint bg-paper font-mono text-[11px] font-medium tracking-[0.08em] text-ink-faint"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              ),
            )}
          </div>
          <span
            aria-hidden="true"
            className="shrink-0 font-mono text-lg leading-[1.2] font-semibold tracking-[0.02em] text-ink"
          >
            {copy.count(completedCount, requiredCount)}
          </span>
        </div>
      )}

      <p className="text-xs leading-normal text-ink-muted">{allDone ? copy.hintDone : copy.hint}</p>
    </div>
  )
}
