import { useRef, type MouseEvent, type PointerEvent } from 'react'
import { STICKER_TYPES } from '@/features/card/stickers'
import { DRAG_THRESHOLD_PX, type StickerBoard } from '@/features/card/useStickerBoard'
import { ja } from '@/shared/i18n/ja'
import type { BadgeType } from '@/shared/types/badge'
import { BadgeSticker } from '@/shared/ui/BadgeSticker'

export interface StickerTrayProps {
  board: StickerBoard
}

// Figma: the tray badges are 39.68px wide.
const TRAY_BADGE = 'w-[39.68px] shrink-0'
// A click this soon after a drag ended is the tail of that drag, not a tap.
const CLICK_AFTER_DRAG_MS = 400

// Sticker tray under the card (Figma: S13 badge tray): the badges I have, and the photo badge
// that cannot be earned yet.
export function StickerTray({ board }: StickerTrayProps) {
  const { complete: copy } = ja

  return (
    <div className="flex items-center gap-2 rounded-[20px] bg-surface px-4 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] leading-normal font-bold text-ink">{copy.trayTitle}</p>
        <p className="text-[11px] leading-normal text-gate">{copy.trayHint}</p>
      </div>
      {STICKER_TYPES.map((type) => (
        <TrayBadge key={type} type={type} board={board} />
      ))}
      {/* TODO(api): the photo badge is not in the API (BadgeType has no "photo"), so it stays
          locked: a picture, not a button. */}
      <span role="img" aria-label={copy.lockedBadge} className={TRAY_BADGE}>
        <BadgeSticker kind="photo" locked />
      </span>
    </div>
  )
}

interface TrayDrag {
  pointerId: number
  startX: number
  startY: number
  dragging: boolean
}

// A badge I have: tap (or Enter / Space) puts it on the card at its default place, dragging
// carries it there. While it is on the card it is dimmed and disabled.
function TrayBadge({ type, board }: { type: BadgeType; board: StickerBoard }) {
  const { complete: copy } = ja
  const used = board.placements.some((placement) => placement.type === type)
  // Dimmed while it is carried too, but not disabled: a disabled button would lose the drag.
  const carried = board.ghost?.type === type
  const drag = useRef<TrayDrag | null>(null)
  const dragEndedAt = useRef(Number.NEGATIVE_INFINITY)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    // Some browsers send pointer events to a disabled button too.
    if (used || event.button !== 0) return
    // Captured, so the drag goes on when the pointer leaves the tray.
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.dragging) {
      const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY)
      if (distance < DRAG_THRESHOLD_PX) return
      active.dragging = true
    }
    board.dragFromTray(type, board.pointAt(event.clientX, event.clientY))
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    drag.current = null
    // A press that never moved is a tap: the click that follows places the badge.
    if (!active.dragging) return
    dragEndedAt.current = event.timeStamp
    board.dropFromTray(type, board.pointAt(event.clientX, event.clientY))
  }

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    board.dragFromTray(type, null)
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Browsers send a click after the pointerup of a drag; a drop beside the card must not
    // place the badge after all.
    if (event.timeStamp - dragEndedAt.current < CLICK_AFTER_DRAG_MS) return
    board.place(type)
  }

  return (
    // touch-none: dragging a badge never scrolls or refreshes the page.
    <button
      type="button"
      ref={board.trayButtonRef(type)}
      disabled={used}
      aria-label={used ? copy.usedBadge[type] : copy.placeBadge[type]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`${TRAY_BADGE} cursor-grab touch-none rounded-full outline-offset-2 outline-gate transition-opacity select-none focus-visible:outline-2 disabled:cursor-default ${
        used || carried ? 'opacity-35' : ''
      }`}
    >
      <BadgeSticker kind={type} />
    </button>
  )
}
