import { STICKER_TYPES } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'
import { BadgeSticker } from '@/shared/ui/BadgeSticker'

// Figma: the tray badges are 39.68px wide.
const TRAY_BADGE = 'w-[39.68px] shrink-0'

// Sticker tray under the card (Figma: S13 badge tray): the badges I have, and the photo badge
// that cannot be earned yet.
export function StickerTray() {
  const { complete: copy } = ja

  return (
    <div className="flex items-center gap-2 rounded-[20px] bg-surface px-4 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] leading-normal font-bold text-ink">{copy.trayTitle}</p>
        <p className="text-gate text-[11px] leading-normal">{copy.trayHint}</p>
      </div>
      {STICKER_TYPES.map((type) => (
        <span key={type} role="img" aria-label={copy.badgeName[type]} className={TRAY_BADGE}>
          <BadgeSticker kind={type} />
        </span>
      ))}
      {/* TODO(api): the photo badge is not in the API (BadgeType has no "photo"), so it stays locked. */}
      <span role="img" aria-label={copy.lockedBadge} className={TRAY_BADGE}>
        <BadgeSticker kind="photo" locked />
      </span>
    </div>
  )
}
