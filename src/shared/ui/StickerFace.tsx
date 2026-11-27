import type { BadgeType } from '@/shared/types/badge'
import { BadgeSticker } from '@/shared/ui/BadgeSticker'

export interface StickerFaceProps {
  type: BadgeType
  /** Degrees, clockwise. */
  tilt: number
}

// The badge of a sticker at its tilt. Fills the width of its box.
export function StickerFace({ type, tilt }: StickerFaceProps) {
  return (
    <span className="block" style={{ rotate: `${tilt}deg` }}>
      <BadgeSticker kind={type} />
    </span>
  )
}
