import { STICKER_SIZE, STICKER_TILT, type StickerPlacement } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'
import { BadgeSticker } from '@/shared/ui/BadgeSticker'

export interface StickerLayerProps {
  placements: StickerPlacement[]
}

// The badge stickers on the card. Goes inside <PolaroidCard>, whose overlay covers the card box:
// each sticker is placed by its centre, in percent of that box, and may hang over the edge.
export function StickerLayer({ placements }: StickerLayerProps) {
  return (
    <>
      {placements.map(({ type, x, y }) => (
        <div
          key={type}
          role="img"
          aria-label={ja.complete.badgeName[type]}
          className={`absolute -translate-1/2 ${STICKER_SIZE[type]}`}
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        >
          <BadgeSticker kind={type} className={STICKER_TILT[type]} />
        </div>
      ))}
    </>
  )
}
