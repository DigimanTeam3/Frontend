import {
  circlePath,
  fillWithShadow,
  type CardImageStyle,
  type SoftShadow,
} from '@/features/card/lib/cardImageKit'
import type { DrawnSticker } from '@/shared/lib/stickers'
import { ja } from '@/shared/i18n/ja'
import { BADGE_GLYPH } from '@/shared/ui/badgeGlyphs'

// Every number here is a share (in percent) of the sticker width, the same ones BadgeSticker.tsx
// uses as cqw. The sticker is drawn in a 100 x 100 box around its centre.
const RADIUS = 50
const EDGE_SHADOW: SoftShadow = { offsetY: 4.69, blur: 9.38, alpha: 0.22 }
const FACE_RADIUS = RADIUS - 7.81
const FACE_BORDER = 3.125
const FACE_BORDER_ALPHA = 0.4
// Shine: an 28.13 x 14.06 ellipse at left 23.44 / top 11.95, turned by -20deg.
const SHINE = { x: -12.5, y: -31.02, radiusX: 14.07, radiusY: 7.03, alpha: 0.6 }
const SHINE_TILT = (-20 * Math.PI) / 180
// Icon: the 22 x 22 glyph at left 32.81 / top 20.31, 34.38 wide.
const ICON = { x: -17.19, y: -29.69, scale: 34.38 / 22 }
// Label: one line of bold 15.63 text whose box starts at top 60.
const LABEL_SIZE = 15.63
const LABEL_MIDDLE = 60 + LABEL_SIZE / 2 - RADIUS

/** How far a sticker reaches from its centre (shadow included), as a share of its width. */
export const STICKER_REACH = (RADIUS + EDGE_SHADOW.offsetY + EDGE_SHADOW.blur) / 100

/**
 * Draws one badge sticker like <BadgeSticker>: white edge with a shadow, face, shine, icon and
 * label. `centerX`, `centerY` and `width` are in the units of the drawing.
 */
export function drawSticker(
  context: CanvasRenderingContext2D,
  sticker: DrawnSticker,
  centerX: number,
  centerY: number,
  width: number,
  style: CardImageStyle,
) {
  // Only the complete badge has a light face; its icon and label take the point colour.
  const light = sticker.type === 'complete'
  const ink = light ? style.gate : 'white'

  context.save()
  context.translate(centerX, centerY)
  context.rotate((sticker.tilt * Math.PI) / 180)
  context.scale(width / 100, width / 100)

  fillWithShadow(context, circlePath(RADIUS), 'white', style.ink, [EDGE_SHADOW])

  context.fillStyle = light ? style.page : style.gate
  context.fill(circlePath(FACE_RADIUS))
  if (light) {
    // The border is inside the face, over its fill.
    context.globalAlpha = FACE_BORDER_ALPHA
    context.strokeStyle = style.gate
    context.lineWidth = FACE_BORDER
    context.stroke(circlePath(FACE_RADIUS - FACE_BORDER / 2))
    context.globalAlpha = 1
  }

  context.globalAlpha = SHINE.alpha
  context.fillStyle = 'white'
  context.beginPath()
  context.ellipse(SHINE.x, SHINE.y, SHINE.radiusX, SHINE.radiusY, SHINE_TILT, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  context.fillStyle = ink
  context.save()
  context.translate(ICON.x, ICON.y)
  context.scale(ICON.scale, ICON.scale)
  context.fill(new Path2D(BADGE_GLYPH[sticker.type]))
  context.restore()

  context.font = `700 ${LABEL_SIZE}px ${style.fontFamily}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(ja.badgeSticker[sticker.type], 0, LABEL_MIDDLE)

  context.restore()
}
