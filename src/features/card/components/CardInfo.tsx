import { MemoEditor } from '@/features/card/components/MemoEditor'
import { useMissionsQuery } from '@/shared/api/missions'
import { ja } from '@/shared/i18n/ja'
import type { ExperienceCard } from '@/shared/types/card'

export interface CardInfoProps {
  card: ExperienceCard
  /** The memo is shown as a form. */
  editing: boolean
  onMemoSaved: () => void
  onEditCancel: () => void
}

const LABEL = 'text-gate text-[13px] leading-normal'

// The white list under the card (Figma: S14 info list): my mission progress and the memo.
export function CardInfo({ card, editing, onMemoSaved, onEditCancel }: CardInfoProps) {
  const { cardDetail: copy } = ja
  // Nice to have: the row is left out while the missions load, and when they cannot be read.
  const missions = useMissionsQuery(card.eventId).data

  return (
    <div className="rounded-[20px] bg-surface px-4 py-1">
      {/* TODO(api): companion name on the card — the Figma row "いっしょに行った人" needs it. */}
      {missions && (
        <dl className="border-app flex items-center justify-between gap-3 border-b-[1.5px] py-3">
          <dt className={LABEL}>{copy.missionLabel}</dt>
          <dd className="text-[13px] leading-normal font-medium text-ink">
            {copy.missionValue(missions.myCompletedRequiredCount, missions.requiredCount)}
          </dd>
        </dl>
      )}
      {editing ? (
        <MemoEditor card={card} onSaved={onMemoSaved} onCancel={onEditCancel} />
      ) : (
        <div className="flex flex-col gap-1 py-3">
          <h2 className={LABEL}>{copy.memoLabel}</h2>
          {card.memo ? (
            <p className="text-[13px] leading-[1.6] break-words whitespace-pre-wrap text-ink">
              {card.memo}
            </p>
          ) : (
            <p className="text-ink-faint text-[13px] leading-[1.6]">{copy.memoEmpty}</p>
          )}
        </div>
      )}
    </div>
  )
}
