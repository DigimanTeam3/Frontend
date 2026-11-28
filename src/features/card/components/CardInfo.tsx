import type { Ref } from 'react'
import { MemoEditor } from '@/features/card/components/MemoEditor'
import { useMissionsQuery } from '@/shared/api/missions'
import { ja } from '@/shared/i18n/ja'
import type { ExperienceCard } from '@/shared/types/card'
import { PenIcon } from '@/shared/ui/icons/PenIcon'

export interface CardInfoProps {
  card: ExperienceCard
  /** The memo is shown as a form. */
  editing: boolean
  /** The pencil beside the memo label: opens the memo as a form. */
  onEdit: () => void
  /** The pencil button, so the screen can give the focus back to it when the form closes. */
  editButtonRef?: Ref<HTMLButtonElement>
  onMemoSaved: () => void
  onEditCancel: () => void
}

const LABEL = 'text-gate-ink text-[13px] leading-normal'

// The white list under the card (Figma: S14 info list): my mission progress and the memo, with
// the pencil that edits it.
export function CardInfo({
  card,
  editing,
  onEdit,
  editButtonRef,
  onMemoSaved,
  onEditCancel,
}: CardInfoProps) {
  const { cardDetail: copy } = ja
  // Nice to have: the row is left out while the missions load, and when they cannot be read.
  const missions = useMissionsQuery(card.eventId).data

  return (
    <div className="rounded-[20px] bg-surface px-4 py-1">
      {/* TODO(api): companion name on the card — the Figma row "いっしょに行った人" needs it. */}
      {missions && (
        <dl className="flex items-center justify-between gap-3 border-b-[1.5px] border-app py-3">
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
          <div className="flex items-center justify-between gap-3">
            <h2 className={LABEL}>{copy.memoLabel}</h2>
            {/* 44px touch area around the 18px icon, without making the row taller. */}
            <button
              type="button"
              ref={editButtonRef}
              aria-label={copy.editMemo}
              onClick={onEdit}
              className="-my-3 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-gate-ink"
            >
              <PenIcon className="size-[18px]" />
            </button>
          </div>
          {card.memo ? (
            <p className="text-[13px] leading-[1.6] break-words whitespace-pre-wrap text-ink">
              {card.memo}
            </p>
          ) : (
            <p className="text-[13px] leading-[1.6] text-ink-faint">{copy.memoEmpty}</p>
          )}
        </div>
      )}
    </div>
  )
}
