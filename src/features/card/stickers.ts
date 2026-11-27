import type { CSSProperties } from 'react'
import type { BadgeType } from '@/shared/types/badge'

/** A badge sticker on the card: its centre as fractions (0..1) of the card box. */
export interface StickerPlacement {
  type: BadgeType
  x: number
  y: number
}

/** How a sticker is drawn: its width as a share of the card width, its tilt in degrees (clockwise). */
export interface StickerLook {
  size: number
  tilt: number
}

/** A sticker with its look: what the card detail (S14) and the share image draw. */
export interface DrawnSticker extends StickerPlacement, StickerLook {}

/** The badges every card has, in the order of the tray. */
export const STICKER_TYPES: BadgeType[] = ['complete', 'participation']

// Figma S13: where each badge sits on a new card. The complete badge sticks out over the
// top-right corner.
export const DEFAULT_STICKER_POSITION: Record<BadgeType, { x: number; y: number }> = {
  complete: { x: 0.934, y: 0.049 },
  participation: { x: 0.28, y: 0.603 },
}

// Figma S13: size and tilt are fixed per badge (no resize, no rotation by the user).
export const STICKER_LOOK: Record<BadgeType, StickerLook> = {
  complete: { size: 0.2935, tilt: 10 },
  participation: { size: 0.271, tilt: 0 },
}

// Figma S14: a saved card whose arrangement is not known (the placements are kept in memory
// only, so e.g. after a reload). Complete at the top-right corner, participation hanging off the
// bottom-right one. The Figma "photo" badge cannot be earned yet and is left out.
const DETAIL_STICKERS: DrawnSticker[] = [
  { type: 'complete', x: 0.905, y: 0.045, size: 0.278, tilt: 10 },
  { type: 'participation', x: 0.918, y: 0.93, size: 0.2576, tilt: -8 },
]

export function defaultPlacements(): StickerPlacement[] {
  return STICKER_TYPES.map((type) => ({ type, ...DEFAULT_STICKER_POSITION[type] }))
}

/**
 * The stickers of a saved card: as arranged on the completion screen (same look as there) when
 * that is known, else at the Figma places of the card detail.
 */
export function detailStickers(saved: StickerPlacement[] | undefined): DrawnSticker[] {
  if (!saved) return DETAIL_STICKERS
  // In the order of the completion screen, so the same sticker is on top where two overlap.
  return STICKER_TYPES.flatMap((type) => {
    const placement = saved.find((item) => item.type === type)
    return placement ? [{ ...placement, ...STICKER_LOOK[type] }] : []
  })
}

/**
 * Box of a sticker inside the layer that covers the card box (the children of <PolaroidCard>):
 * centre and width in percent of the card. Use with "absolute -translate-1/2".
 */
export function stickerBoxStyle(sticker: { x: number; y: number; size: number }): CSSProperties {
  return {
    left: `${sticker.x * 100}%`,
    top: `${sticker.y * 100}%`,
    width: `${sticker.size * 100}%`,
  }
}
