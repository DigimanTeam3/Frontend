import { RequiredTag } from '@/features/mission/components/RequiredTag'
import { ja } from '@/shared/i18n/ja'
import type { Mission } from '@/shared/types/mission'

export interface MissionHeaderProps {
  mission: Mission
  /** Place of the mission in the event's list (by sortOrder), starting at 1. */
  position: number
}

// Top block of the submit screen (Figma: S12 header): tag row, title and description.
export function MissionHeader({ mission, position }: MissionHeaderProps) {
  const description = mission.descriptionJa ?? mission.description

  return (
    <div className="flex flex-col gap-1.5">
      {/* The heading comes first for screen readers; the tag row is drawn above it. */}
      <h1
        lang={mission.titleJa === null ? 'ko' : undefined}
        className="text-[22px] leading-[1.4] font-bold break-words text-ink"
      >
        {mission.titleJa ?? mission.title}
      </h1>
      <p className="order-first flex items-center gap-1.5">
        {mission.required && <RequiredTag />}
        <span className="font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] text-ink-faint">
          {ja.missionSubmit.number(position)}
        </span>
      </p>
      {description && (
        <p
          lang={mission.descriptionJa === null ? 'ko' : undefined}
          className="text-[13px] leading-[1.6] break-words text-ink-muted"
        >
          {description}
        </p>
      )}
    </div>
  )
}
