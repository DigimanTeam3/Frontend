import type { BadgeType } from '@/shared/types/badge'

/** A badge sticker on the card: its centre as fractions (0..1) of the card box. */
export interface StickerPlacement {
  type: BadgeType
  x: number
  y: number
}

/** The badges every card has, in the order of the tray. */
export const STICKER_TYPES: BadgeType[] = ['complete', 'participation']

// Figma S13: where each badge sits on a new card. The complete badge sticks out over the
// top-right corner.
export const DEFAULT_STICKER_POSITION: Record<BadgeType, { x: number; y: number }> = {
  complete: { x: 0.934, y: 0.049 },
  participation: { x: 0.28, y: 0.603 },
}

// Size and tilt are fixed per badge (no resize, no rotation by the user). The width is a share
// of the card width: cqw of the PolaroidCard box.
export const STICKER_SIZE: Record<BadgeType, string> = {
  complete: 'w-[29.35cqw]',
  participation: 'w-[27.1cqw]',
}
export const STICKER_TILT: Record<BadgeType, string> = {
  complete: 'rotate-10',
  participation: '',
}

export function defaultPlacements(): StickerPlacement[] {
  return STICKER_TYPES.map((type) => ({ type, ...DEFAULT_STICKER_POSITION[type] }))
}
