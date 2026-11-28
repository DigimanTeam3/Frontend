import { StickerFace } from '@/features/card/components/StickerFace'
import { stickerBoxStyle, type DrawnSticker } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'

export interface CardStickersProps {
  stickers: DrawnSticker[]
}

// The badge stickers of a saved card (S14): pictures only, nothing to select or move. Goes
// inside <PolaroidCard>, like the StickerLayer of the completion screen.
export function CardStickers({ stickers }: CardStickersProps) {
  return stickers.map((sticker) => (
    <div
      key={sticker.type}
      role="img"
      aria-label={ja.complete.badgeName[sticker.type]}
      className="pointer-events-none absolute -translate-1/2"
      style={stickerBoxStyle(sticker)}
    >
      <StickerFace type={sticker.type} tilt={sticker.tilt} />
    </div>
  ))
}
