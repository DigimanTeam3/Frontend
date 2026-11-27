import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { StickerFace } from '@/features/card/components/StickerFace'
import { STICKER_LOOK, stickerBoxStyle, type StickerPlacement } from '@/features/card/stickers'
import { DRAG_THRESHOLD_PX, type StickerBoard } from '@/features/card/useStickerBoard'
import { ja } from '@/shared/i18n/ja'
import { CloseIcon } from '@/shared/ui/icons/CloseIcon'

export interface PlacedStickerProps {
  placement: StickerPlacement
  board: StickerBoard
  /** id of the text that explains the keys (aria-describedby). */
  hintId: string
}

// Arrow keys move the selected sticker by this share of the card (with Shift: the big step).
const NUDGE_STEP = 0.02
const NUDGE_STEP_BIG = 0.1
const ARROW_DIRECTION: Record<string, [x: number, y: number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}
// Near the right edge the remove button moves to the left corner, so it stays on the screen.
const REMOVE_BUTTON_FLIP_X = 0.7

interface Drag {
  pointerId: number
  startX: number
  startY: number
  /** From the sticker's centre to the grabbed spot (card fractions): it must not jump. */
  grabX: number
  grabY: number
  moved: boolean
}

// One badge sticker on the card: tap selects it, dragging moves it, the × takes it off.
export function PlacedSticker({ placement, board, hintId }: PlacedStickerProps) {
  const { type, x, y } = placement
  const look = STICKER_LOOK[type]
  const { complete: copy } = ja
  const selected = board.selected === type
  const drag = useRef<Drag | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const point = board.pointAt(event.clientX, event.clientY)
    if (!point) return
    // Captured, so the drag goes on when the pointer leaves the sticker.
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      grabX: point.x - x,
      grabY: point.y - y,
      moved: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.moved) {
      const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY)
      if (distance < DRAG_THRESHOLD_PX) return
      active.moved = true
      board.select(type)
    }
    const point = board.pointAt(event.clientX, event.clientY)
    if (point) board.moveTo(type, { x: point.x - active.grabX, y: point.y - active.grabY })
  }

  // A press that never moved is a tap: the click that follows selects the sticker.
  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      board.select(null)
      return
    }
    // Enter and Space select through the button's click. The other keys act on a selected sticker.
    if (!selected) return
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      board.remove(type)
      return
    }
    const direction = ARROW_DIRECTION[event.key]
    if (!direction) return
    // No page scroll while the arrows move the sticker.
    event.preventDefault()
    const step = event.shiftKey ? NUDGE_STEP_BIG : NUDGE_STEP
    board.nudge(type, direction[0] * step, direction[1] * step)
  }

  return (
    <div
      data-sticker-ui
      className={`absolute -translate-1/2 ${selected ? 'z-10' : ''}`}
      style={stickerBoxStyle({ x, y, size: look.size })}
    >
      {/* touch-none: dragging a sticker never scrolls or refreshes the page. */}
      <button
        type="button"
        ref={board.stickerButtonRef(type)}
        aria-label={copy.badgeName[type]}
        aria-pressed={selected}
        aria-describedby={hintId}
        onClick={() => board.select(type)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className="outline-gate block w-full cursor-grab touch-none rounded-full outline-offset-2 select-none focus-visible:outline-2"
      >
        <StickerFace type={type} tilt={look.tilt} />
      </button>
      {selected && (
        <>
          {/* Figma: dashed box 6px around the sticker, remove button on its top corner
              (sizes as shares of the 283.5px card). The button's ::before widens the 24px
              circle to a 40px touch target. */}
          <span
            aria-hidden="true"
            className="border-gate pointer-events-none absolute -inset-[2.12cqw] rounded-[2.12cqw] border-[1.5px] border-dashed"
          />
          <button
            type="button"
            aria-label={copy.removeBadge[type]}
            onClick={() => board.remove(type)}
            className={`bg-gate absolute -top-[2.12cqw] flex size-[max(24px,8.47cqw)] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-white before:absolute before:-inset-2.5 before:rounded-full before:content-[''] ${
              x > REMOVE_BUTTON_FLIP_X
                ? '-left-[2.12cqw] -translate-x-1/2'
                : '-right-[2.12cqw] translate-x-1/2'
            }`}
          >
            <CloseIcon className="size-3" strokeWidth={2.3} />
          </button>
        </>
      )}
    </div>
  )
}
