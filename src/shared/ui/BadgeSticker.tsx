import { ja } from '@/shared/i18n/ja'

/** participation / complete are the badges of the API; photo has no API yet (always locked). */
export type BadgeStickerKind = 'participation' | 'complete' | 'photo'

export interface BadgeStickerProps {
  kind: BadgeStickerKind
  /** Not earned yet: the whole sticker fades. */
  locked?: boolean
  /** The sticker is as wide as its box; size it here (e.g. "w-10") or by the parent. */
  className?: string
}

// Face, and the color of the icon and label on it. Only the complete badge has a light face.
const LOOK: Record<BadgeStickerKind, { face: string; ink: string }> = {
  participation: { face: 'bg-gate', ink: 'text-white' },
  complete: { face: 'border-gate/40 bg-app border-[3.125cqw]', ink: 'text-gate' },
  photo: { face: 'bg-gate/40', ink: 'text-white' },
}

// 22px glyphs of the Figma badge: heart, five-point star, four-petal flower.
const GLYPH: Record<BadgeStickerKind, string> = {
  participation:
    'M11 19.25S3.667 14.483 3.667 9.167C3.672 8.316 3.94 7.488 4.435 6.795 4.929 6.103 5.626 5.58 6.429 5.299 7.232 5.018 8.102 4.992 8.921 5.225 9.739 5.458 10.465 5.938 11 6.6 11.535 5.938 12.261 5.458 13.079 5.225 13.898 4.992 14.768 5.018 15.571 5.299 16.374 5.58 17.071 6.103 17.565 6.795 18.06 7.488 18.328 8.316 18.333 9.167 18.333 14.483 11 19.25 11 19.25z',
  complete:
    'M11 1.833l2.75 5.959 6.417.733-4.767 4.4 1.375 6.417L11 16.133 5.225 19.25 6.6 12.833 1.833 8.525l6.417-.733L11 1.833z',
  photo:
    'M11 7.792a2.933 2.933 0 110-5.867 2.933 2.933 0 010 5.867zm0 12.283a2.933 2.933 0 110-5.867 2.933 2.933 0 010 5.867zm-6.142-6.142a2.933 2.933 0 110-5.866 2.933 2.933 0 010 5.866zm12.284 0a2.933 2.933 0 110-5.866 2.933 2.933 0 010 5.866zM11 13.75a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z',
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
        <path d={GLYPH[kind]} />
      </svg>
      <span
        className={`absolute inset-x-0 top-[60cqw] text-center text-[length:15.63cqw] leading-none font-bold whitespace-nowrap ${ink}`}
      >
        {ja.badgeSticker[kind]}
      </span>
    </span>
  )
}
