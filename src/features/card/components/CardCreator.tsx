import { useState, type PointerEvent } from 'react'
import { useNavigate } from 'react-router'
import { useUpdateCardMutation } from '@/features/card/api'
import { StickerLayer } from '@/features/card/components/StickerLayer'
import { StickerTray } from '@/features/card/components/StickerTray'
import { defaultPlacements, fromSavedPlacements, toSavedPlacements } from '@/shared/lib/stickers'
import { useStickerStore } from '@/shared/stores/stickerStore'
import { useStickerBoard } from '@/features/card/useStickerBoard'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import type { ExperienceCard } from '@/shared/types/card'
import { Button } from '@/shared/ui/Button'
import { PolaroidCard } from '@/shared/ui/PolaroidCard'

export interface CardCreatorProps {
  card: ExperienceCard
}

// The loaded screen (Figma: S13 カード生成): heading, the new card with its badge stickers, the
// sticker tray and the save button. Saving keeps the arrangement on the card, so the card detail
// (S14) and My Page show it on any device.
export function CardCreator({ card }: CardCreatorProps) {
  const navigate = useNavigate()
  const { complete: copy } = ja
  const savePlacements = useStickerStore((state) => state.savePlacements)
  const { mutateAsync: updateCard, isPending: saving } = useUpdateCardMutation(card.id)
  const [saveFailed, setSaveFailed] = useState(false)
  // What was arranged earlier in this session, else what the card keeps, else both badges at
  // their Figma places.
  const board = useStickerBoard(
    () =>
      useStickerStore.getState().placementsByCard[card.id] ??
      fromSavedPlacements(card.stickerPlacements) ??
      defaultPlacements(),
  )

  // A tap anywhere but on a sticker (or its remove button) ends the selection.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[data-sticker-ui]')) return
    board.select(null)
  }

  const handleSave = async () => {
    savePlacements(card.id, board.placements)
    setSaveFailed(false)
    try {
      await updateCard({ stickerPlacements: toSavedPlacements(board.placements) })
      // justMade: on the card detail, going back then leads home (see CardDetailScreen).
      void navigate(paths.cardDetail(card.id), { replace: true, state: { justMade: true } })
    } catch {
      setSaveFailed(true)
    }
  }

  return (
    <div className="flex flex-1 flex-col" onPointerDown={handlePointerDown}>
      <div className="mt-4 flex flex-col items-center gap-0.5 text-center">
        <h1 className="text-[26px] leading-[1.4] font-bold text-ink">{copy.title}</h1>
        <p className="text-[13px] leading-normal font-medium text-gate-ink">{copy.subtitle}</p>
      </div>

      {/* Figma stage: the card is 283.5px of the 342px content width. The margin beside it is
          the room for stickers that hang over the edge. */}
      <div className="mx-auto mt-6 w-[82.9%] max-w-[283.5px]">
        <PolaroidCard {...polaroidCardText(card)} ref={board.cardRef}>
          <StickerLayer board={board} />
        </PolaroidCard>
      </div>

      <div className="mt-auto flex flex-col gap-6 pt-6">
        <StickerTray board={board} />
        {saveFailed && (
          <p
            role="alert"
            className="rounded-[10px] bg-danger/10 px-3 py-2.5 text-[13px] leading-[1.6] text-danger"
          >
            {copy.saveError}
          </p>
        )}
        {/* Figma S13 draws this button 54px high with 16px text. The `!` makes these win over the
            shared 52px / 15px size classes whatever their order in the stylesheet. */}
        <Button
          variant="accent"
          shape="pill"
          fullWidth
          className="h-[54px]! text-base!"
          disabled={saving}
          aria-busy={saving}
          onClick={() => void handleSave()}
        >
          {saving ? copy.saving : copy.save}
        </Button>
      </div>
    </div>
  )
}
