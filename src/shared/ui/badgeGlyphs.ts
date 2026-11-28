/** participation / complete are the badges of the API; photo has no API yet (always locked). */
export type BadgeStickerKind = 'participation' | 'complete' | 'photo'

// 22px glyphs of the Figma badge (SVG path data in a 22 x 22 box): heart, five-point star,
// four-petal flower. Apart from BadgeSticker.tsx because the share image of a card draws the
// same glyphs on a canvas.
export const BADGE_GLYPH: Record<BadgeStickerKind, string> = {
  participation:
    'M11 19.25S3.667 14.483 3.667 9.167C3.672 8.316 3.94 7.488 4.435 6.795 4.929 6.103 5.626 5.58 6.429 5.299 7.232 5.018 8.102 4.992 8.921 5.225 9.739 5.458 10.465 5.938 11 6.6 11.535 5.938 12.261 5.458 13.079 5.225 13.898 4.992 14.768 5.018 15.571 5.299 16.374 5.58 17.071 6.103 17.565 6.795 18.06 7.488 18.328 8.316 18.333 9.167 18.333 14.483 11 19.25 11 19.25z',
  complete:
    'M11 1.833l2.75 5.959 6.417.733-4.767 4.4 1.375 6.417L11 16.133 5.225 19.25 6.6 12.833 1.833 8.525l6.417-.733L11 1.833z',
  photo:
    'M11 7.792a2.933 2.933 0 110-5.867 2.933 2.933 0 010 5.867zm0 12.283a2.933 2.933 0 110-5.867 2.933 2.933 0 010 5.867zm-6.142-6.142a2.933 2.933 0 110-5.866 2.933 2.933 0 010 5.866zm12.284 0a2.933 2.933 0 110-5.866 2.933 2.933 0 010 5.866zM11 13.75a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z',
}
