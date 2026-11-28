import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

/** Figma note (S10): the stub tears when it is let go more than 96px below its place. */
export const TEAR_THRESHOLD_PX = 96
/**
 * Length of the fall after the tear, and of the spring-back after an early release. Keep in
 * sync with the `duration-300` classes of the stub.
 */
const TEAR_ANIMATION_MS = 320
const TEAR_FALL_PX = 160
/** A press that moved less than this is a tap, not a drag. */
const TAP_SLOP_PX = 6
/** Figma draws the pulled stub tilted by 5deg; the tilt grows with the pull up to this. */
const MAX_TILT_DEG = 6

/** idle: in place (or springing back). dragging: follows the finger. tearing: falling away. */
export type TearPhase = 'idle' | 'dragging' | 'tearing'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Pull-down-to-tear for the ticket stub. Spread `stubHandlers` and `stubStyle` on the element
 * that wraps the stub; it needs `touch-action: none` so the pull never scrolls or refreshes the
 * page. `tear()` tears without a drag (button, keyboard). `onTorn` runs once, after the fall.
 */
export function useStubTear(onTorn: () => void) {
  const [phase, setPhase] = useState<TearPhase>('idle')
  const [offsetY, setOffsetY] = useState(0)
  // Let go early and still on its way back: offsetY is already 0, the stub is not home yet.
  const [settling, setSettling] = useState(false)

  const pointerIdRef = useRef<number | null>(null)
  const startYRef = useRef(0)
  // Last pull of the running drag (a cancelled pointer does not report a usable position).
  const pullRef = useRef(0)
  const draggedRef = useRef(false)
  const tornRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const onTornRef = useRef(onTorn)
  useEffect(() => {
    onTornRef.current = onTorn
  })
  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      clearTimeout(settleTimerRef.current)
    },
    [],
  )

  const tear = useCallback(() => {
    if (tornRef.current) return
    tornRef.current = true
    pointerIdRef.current = null
    // No fall for people who asked for less motion: go on at once.
    if (prefersReducedMotion()) {
      onTornRef.current()
      return
    }
    setPhase('tearing')
    timerRef.current = setTimeout(() => onTornRef.current(), TEAR_ANIMATION_MS)
  }, [])

  const pullOf = (event: PointerEvent) => Math.max(0, event.clientY - startYRef.current)

  const endDrag = (event: PointerEvent, released: boolean) => {
    if (event.pointerId !== pointerIdRef.current) return
    pointerIdRef.current = null
    if (released && pullOf(event) > TEAR_THRESHOLD_PX) {
      tear()
    } else {
      // Let go too early (or the browser took the touch away): back to its place.
      setPhase('idle')
      setOffsetY(0)
      // The spring-back takes a moment; with reduced motion the stub jumps home at once.
      if (pullRef.current > 0 && !prefersReducedMotion()) {
        setSettling(true)
        clearTimeout(settleTimerRef.current)
        settleTimerRef.current = setTimeout(() => setSettling(false), TEAR_ANIMATION_MS)
      }
    }
  }

  const stubHandlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (tornRef.current || pointerIdRef.current !== null) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      // Keep getting the moves when the finger leaves the stub.
      event.currentTarget.setPointerCapture(event.pointerId)
      pointerIdRef.current = event.pointerId
      startYRef.current = event.clientY
      pullRef.current = 0
      draggedRef.current = false
      setPhase('dragging')
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerId !== pointerIdRef.current) return
      const pull = pullOf(event)
      pullRef.current = pull
      if (pull > TAP_SLOP_PX) draggedRef.current = true
      setOffsetY(pull)
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => endDrag(event, true),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => endDrag(event, false),
    // A plain tap (and a screen reader's activation) tears too; the click after a drag does not.
    onClick: () => {
      const dragged = draggedRef.current
      draggedRef.current = false
      if (!dragged) tear()
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      tear()
    },
  }

  const tearing = phase === 'tearing'
  const tilt = tearing ? MAX_TILT_DEG + 4 : Math.min(offsetY / 12, MAX_TILT_DEG)
  const stubStyle: CSSProperties = {
    transform: `translateY(${tearing ? offsetY + TEAR_FALL_PX : offsetY}px) rotate(${tilt}deg)`,
    opacity: tearing ? 0 : 1,
  }

  return { phase, offsetY, settling, tear, stubHandlers, stubStyle }
}
