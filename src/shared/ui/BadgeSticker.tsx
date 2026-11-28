import { ja } from '@/shared/i18n/ja'
import { BADGE_GLYPH, type BadgeStickerKind } from '@/shared/ui/badgeGlyphs'

export type { BadgeStickerKind }

export interface BadgeStickerProps {
  kind: BadgeStickerKind
  /** Not earned yet: the whole sticker fades. */
  locked?: boolean
  /**
   * The sticker fills the width of its box: give it a width here (e.g. "w-10") or put it in a
   * parent with a fixed width (it cannot size a shrink-to-fit parent by itself).
   */
  className?: string
}

// Face, and the color of the icon and label on it. Only the complete badge has a light face.
const LOOK: Record<BadgeStickerKind, { face: string; ink: string }> = {
  participation: { face: 'bg-gate', ink: 'text-ink' },
  complete: { face: 'border-gate/40 bg-app border-[3.125cqw]', ink: 'text-gate-ink' },
  photo: { face: 'bg-gate/40', ink: 'text-ink' },
}

// Round badge sticker (Figma: Badge, 64px): white edge with a shadow, colored face, shine, icon
// and label. Shared because the card screens (S13, S14) and My Page all show it. Every inner
// size is a share of the sticker's own width (cqw), so it looks the same at any size.
export function BadgeSticker({ kind, locked = false, className }: BadgeStickerProps) {
  const { face, ink } = LOOK[kind]
  return (
    <span
      className={`@container relative block aspect-square w-full select-none ${
        locked ? 'opacity-35' : ''
      } ${className ?? ''}`}
    >
      <span className="absolute inset-0 rounded-full bg-white shadow-[0_4.69cqw_9.38cqw] shadow-ink/22" />
      <span className={`absolute inset-[7.81cqw] rounded-full ${face}`} />
      <span className="absolute top-[11.95cqw] left-[23.44cqw] h-[14.06cqw] w-[28.13cqw] -rotate-20 rounded-[50%] bg-white/60" />
      <svg
        viewBox="0 0 22 22"
        fill="currentColor"
        aria-hidden="true"
        className={`absolute top-[20.31cqw] left-[32.81cqw] size-[34.38cqw] ${ink}`}
      >
        <path d={BADGE_GLYPH[kind]} />
      </svg>
      <span
        className={`absolute inset-x-0 top-[60cqw] text-center text-[length:15.63cqw] leading-none font-bold whitespace-nowrap ${ink}`}
      >
        {ja.badgeSticker[kind]}
      </span>
    </span>
  )
}
