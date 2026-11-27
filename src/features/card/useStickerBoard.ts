import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_STICKER_POSITION, type StickerPlacement } from '@/features/card/stickers'
import type { BadgeType } from '@/shared/types/badge'

/** A place on the card, as fractions of the card box (0,0 = top-left, 1,1 = bottom-right). */
export interface CardPoint {
  x: number
  y: number
}

/** A pointer must travel this far before a press counts as a drag instead of a tap. */
export const DRAG_THRESHOLD_PX = 6

// A badge dragged from the tray lands when its centre is released on the card, or beside it by
// up to about half a sticker (the sticker would still touch the card).
const DROP_MARGIN_X = 0.14
const DROP_MARGIN_Y = 0.09

type ButtonRefs = Partial<Record<BadgeType, HTMLButtonElement | null>>

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

// The centre stays on the card, so a sticker hangs over the edge by half its size at most.
function onCard(type: BadgeType, point: CardPoint): StickerPlacement {
  return { type, x: clamp01(point.x), y: clamp01(point.y) }
}

// State of the sticker arrangement of one card: which badges are on the card and where, which
// one is selected, and the badge being dragged in from the tray. Screen state only.
export function useStickerBoard(initialPlacements: () => StickerPlacement[]) {
  const [placements, setPlacements] = useState(initialPlacements)
  const [selected, setSelected] = useState<BadgeType | null>(null)
  const [ghost, setGhost] = useState<StickerPlacement | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // The buttons, to hand the keyboard focus over when a badge moves between tray and card.
  const stickerButtons = useRef<ButtonRefs>({})
  const trayButtons = useRef<ButtonRefs>({})

  /** A viewport position as a point of the card, measured now (any card width, any scroll). */
  function pointAt(clientX: number, clientY: number): CardPoint | null {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }
  }

  /** Puts the badge on the card (at its default place when no point is given) and selects it. */
  function place(type: BadgeType, point: CardPoint = DEFAULT_STICKER_POSITION[type]) {
    // Rendered at once: the tray button is disabled by this, so the focus goes to the sticker.
    flushSync(() => {
      setPlacements((list) => [...list.filter((p) => p.type !== type), onCard(type, point)])
      setSelected(type)
    })
    stickerButtons.current[type]?.focus({ preventScroll: true })
  }

  return {
    placements,
    selected,
    /** The tray badge being dragged towards the card; it may be above or below the card. */
    ghost,
    /** Put on the element that covers exactly the card box. */
    cardRef,
    stickerButtonRef: (type: BadgeType) => (element: HTMLButtonElement | null) => {
      stickerButtons.current[type] = element
    },
    trayButtonRef: (type: BadgeType) => (element: HTMLButtonElement | null) => {
      trayButtons.current[type] = element
    },
    pointAt,
    select: setSelected,
    place,
    moveTo(type: BadgeType, point: CardPoint) {
      setPlacements((list) => list.map((p) => (p.type === type ? onCard(type, point) : p)))
    },
    nudge(type: BadgeType, dx: number, dy: number) {
      setPlacements((list) =>
        list.map((p) => (p.type === type ? onCard(type, { x: p.x + dx, y: p.y + dy }) : p)),
      )
    },
    /** Takes the badge off the card; it is back in the tray. */
    remove(type: BadgeType) {
      // Rendered at once: the sticker is gone by this, so the focus goes to its tray button.
      flushSync(() => {
        setPlacements((list) => list.filter((p) => p.type !== type))
        setSelected((current) => (current === type ? null : current))
      })
      trayButtons.current[type]?.focus({ preventScroll: true })
    },
    /** A badge is being carried from the tray (null: the drag was cancelled). */
    dragFromTray(type: BadgeType, point: CardPoint | null) {
      // Sideways it stays over the card: carried past the screen edge it would make the page
      // scroll horizontally. Up and down it follows the pointer freely.
      setGhost(point && { type, x: clamp01(point.x), y: point.y })
    },
    /** End of a drag from the tray: lands on the card, or goes back to the tray. */
    dropFromTray(type: BadgeType, point: CardPoint | null) {
      setGhost(null)
      const landed =
        point !== null &&
        point.x >= -DROP_MARGIN_X &&
        point.x <= 1 + DROP_MARGIN_X &&
        point.y >= -DROP_MARGIN_Y &&
        point.y <= 1 + DROP_MARGIN_Y
      if (landed) place(type, point)
    },
  }
}

export type StickerBoard = ReturnType<typeof useStickerBoard>
