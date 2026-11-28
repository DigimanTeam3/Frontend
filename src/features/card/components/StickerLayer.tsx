import { useId } from 'react'
import { PlacedSticker } from '@/features/card/components/PlacedSticker'
import { StickerFace } from '@/features/card/components/StickerFace'
import { STICKER_LOOK, STICKER_TYPES, stickerBoxStyle } from '@/features/card/stickers'
import type { StickerBoard } from '@/features/card/useStickerBoard'
import { ja } from '@/shared/i18n/ja'

export interface StickerLayerProps {
  board: StickerBoard
}

// The badge stickers on the card. Goes inside <PolaroidCard>, whose overlay covers the card box:
// each sticker is placed by its centre, in percent of that box, and may hang over the edge.
export function StickerLayer({ board }: StickerLayerProps) {
  const hintId = useId()
  const { ghost } = board

  return (
    <>
      <p id={hintId} className="sr-only">
        {ja.complete.stickerHint}
      </p>
      {/* Always in the same order: moving a sticker's element while it is dragged would end
          the drag. The selected one is lifted with z-index instead. */}
      {STICKER_TYPES.map((type) => {
        const placement = board.placements.find((p) => p.type === type)
        return (
          placement && (
            <PlacedSticker key={type} placement={placement} board={board} hintId={hintId} />
          )
        )
      })}
      {/* A badge on its way from the tray: follows the pointer, also outside the card. */}
      {ghost && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 -translate-1/2"
          style={stickerBoxStyle({ ...ghost, size: STICKER_LOOK[ghost.type].size })}
        >
          <StickerFace type={ghost.type} tilt={STICKER_LOOK[ghost.type].tilt} />
        </div>
      )}
    </>
  )
}
