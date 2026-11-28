import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

/** Figma note (S10): the perforation gives way once the stub is pulled 96px below its place. */
export const TEAR_THRESHOLD_PX = 96
/** Holes along the perforation: the paper holds a little at each one, then gives (stick-slip). */
const PERFORATION_HOLES = 30
/** How much a hole holds the stub back before it gives, in degrees. */
const STICK_DEG = 0.9
const MAX_ANGLE_DEG = 40
/** The stub opens a little less than the finger moves: paper is stiff. */
const PAPER_GIVE = 0.92
/** Sideways, the paper only stretches: this much of the finger's move, up to 10px. */
const STRETCH = 0.16
/** A press that moved less than this is a tap, not a drag. */
const TAP_SLOP_PX = 6
/** Let go while flicking down this fast (px/ms) with this much torn: the stub comes off anyway. */
const FLICK_SPEED = 0.9
const FLICK_MIN_TORN = 0.35
/** Release speed is measured over the pointer's moves in this last stretch of time. */
const VELOCITY_WINDOW_MS = 90
/** Fall after the stub comes off; onTorn runs at its end. */
const FLY_MS = 860
const GRAVITY = 0.0032
/** Air holds paper back: it falls no faster than GRAVITY / AIR_DRAG (about 1.3 px/ms). */
const AIR_DRAG = 0.0025
/** The free corner lifts toward the viewer as the stub opens, up to this (3D, deg). */
const LIFT_DEG = 22
/** While it falls, the paper flutters (turns over its width) and drifts from side to side. */
const FLUTTER_DEG = 38
const FLUTTER_PER_MS = 0.013
const SWAY_PX_PER_MS = 0.22
/** Spring of an early release (per ms): back home in about 0.3s with one small bounce. */
const SPRING_K = 0.0011
const SPRING_C = 0.036
/** Tap, Enter or the button: the same tear, played by itself. */
const SCRIPT_MS = 520
/** With reduced motion the stub does not fly or turn: it just fades. */
const FADE_MS = 180
/**
 * Extra time before onTorn is forced. The tear is drawn frame by frame, and frames can be slow
 * or stop (a weak phone, power saving, a tab in the background): the next screen must not wait
 * for them.
 */
const FINISH_GRACE_MS = 600
/** Haptic pulses (Android; iOS has no vibration and keeps the visual only). */
const HOLE_BUZZ_MS = 5
const MIN_BUZZ_GAP_MS = 40
const SNAP_BUZZ_MS = 22
const BUMP_BUZZ_MS = 6

type Mode = 'home' | 'drag' | 'spring' | 'script' | 'fly' | 'done'

interface Sample {
  t: number
  x: number
  y: number
}

interface Sim {
  mode: Mode
  reduced: boolean
  /** 1: the tear starts at the left edge (the stub hinges on its right corner). -1: mirrored. */
  dir: 1 | -1
  /** Distance from the hinge corner to the grabbed point, px. */
  lever: number
  /** Rotation around the hinge corner (deg), shift (px), and their speeds (per ms). */
  angle: number
  tx: number
  ty: number
  angleV: number
  txV: number
  tyV: number
  /** How much of the perforation is torn (0..1). Never heals: a let-go stub keeps its crack. */
  torn: number
  holes: number
  pointerId: number | null
  x0: number
  y0: number
  /** Where the press started, for telling a tap from a drag. */
  downX: number
  downY: number
  /** Latest pointer position, applied on the next frame. */
  px: number
  py: number
  samples: Sample[]
  dragged: boolean
  bumped: boolean
  lastBuzz: number
  /** Free fall speed (px/ms) and spin (deg/ms) after the stub came off. */
  vx: number
  vy: number
  spin: number
  /** 3D: the free corner lifted toward the viewer (deg), and its speed after the stub came off. */
  lift: number
  liftV: number
  elapsed: number
  scriptFrom: number
  lastFrame: number
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const DEG = 180 / Math.PI

/**
 * Drag-to-tear for the ticket stub. Put `rootRef` on an element around the whole ticket (the
 * torn seam reads `--tear-p` and `--tear-dir` from it), `stubRef` and `stubHandlers` on the
 * element that wraps the stub (it needs `touch-action: none`), and `shadowRef` / `lightRef` on
 * its shadow and shading layers. Every frame is written straight to those elements (transform
 * and opacity only); React state changes only when the stub leaves or comes home.
 * `tear()` tears without a drag (button, keyboard). `onTorn` runs once, after the fall.
 */
export function useStubTear(onTorn: () => void) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stubRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLDivElement>(null)
  /** The stub is out of its place (the ticket's glow goes). */
  const [away, setAway] = useState(false)
  /** The stub is coming off (scripted tear, fall): nothing can stop it any more. */
  const [leaving, setLeaving] = useState(false)

  const sim = useRef<Sim>({
    mode: 'home',
    reduced: false,
    dir: 1,
    lever: 240,
    angle: 0,
    tx: 0,
    ty: 0,
    angleV: 0,
    txV: 0,
    tyV: 0,
    torn: 0,
    holes: 0,
    pointerId: null,
    x0: 0,
    y0: 0,
    downX: 0,
    downY: 0,
    px: 0,
    py: 0,
    samples: [],
    dragged: false,
    bumped: false,
    lastBuzz: -Infinity,
    vx: 0,
    vy: 0,
    spin: 0,
    lift: 0,
    liftV: 0,
    elapsed: 0,
    scriptFrom: 0,
    lastFrame: 0,
  })
  const frameRef = useRef<number | null>(null)
  const finishTimerRef = useRef<number | null>(null)
  // Read again after a call that may have changed it (TypeScript keeps the earlier narrowing).
  const modeNow = (): Mode => sim.current.mode

  const onTornRef = useRef(onTorn)
  useEffect(() => {
    onTornRef.current = onTorn
  })
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      // Leaving the screen: onTorn must not run later, from the timer.
      if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    },
    [],
  )

  const buzz = (ms: number, now: number) => {
    const s = sim.current
    if (now - s.lastBuzz < MIN_BUZZ_GAP_MS) return
    s.lastBuzz = now
    // Missing on iOS Safari; may also be refused without a user gesture. Both are fine.
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms)
  }

  const paint = () => {
    const s = sim.current
    const stub = stubRef.current
    if (!stub) return
    const falling = s.mode === 'fly' || s.mode === 'done'
    const fadeFrom = s.reduced ? 0 : FLY_MS * 0.6
    const fadeLength = s.reduced ? FADE_MS : FLY_MS - fadeFrom
    const opacity = falling ? clamp(1 - (s.elapsed - fadeFrom) / fadeLength, 0, 1) : 1
    const tilt = Math.min(Math.abs(s.angle) / 30, 1)
    const lift = falling && !s.reduced ? Math.min(s.elapsed / 240, 1) : 0

    // Held by the hinge the free corner comes up off the page; falling, it keeps turning and
    // flutters. Turning over its width stays below 90deg, so the blank back never shows.
    const liftDeg = s.reduced ? 0 : falling ? s.lift : s.dir * tilt * LIFT_DEG
    const flutter =
      falling && !s.reduced
        ? Math.sin(s.elapsed * FLUTTER_PER_MS) * FLUTTER_DEG * Math.min(s.elapsed / 200, 1)
        : 0
    stub.style.transformOrigin = s.dir === 1 ? '100% 0' : '0 0'
    stub.style.transform = `perspective(900px) translate3d(${s.tx}px, ${s.ty}px, 0) rotate(${s.angle}deg) rotateY(${liftDeg}deg) rotateX(${flutter}deg)`
    stub.style.opacity = String(opacity)
    rootRef.current?.style.setProperty('--tear-p', s.torn.toFixed(4))
    rootRef.current?.style.setProperty('--tear-dir', String(s.dir))
    if (lightRef.current) lightRef.current.style.opacity = String(tilt)
    if (shadowRef.current) {
      // The shadow lies further away as the stub lifts off the page.
      shadowRef.current.style.opacity = String(Math.min(1, tilt * 1.5 + lift) * 0.45)
      shadowRef.current.style.transform = `translate3d(${2 + tilt * 4 + lift * 10}px, ${
        3 + tilt * 6 + lift * 18
      }px, 0)`
    }
  }

  const finish = () => {
    const s = sim.current
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current)
    finishTimerRef.current = null
    if (s.mode === 'done') return
    s.mode = 'done'
    onTornRef.current()
  }

  /** The tear cannot be stopped any more: onTorn runs after `ms` at the latest, frames or not. */
  const finishWithin = (ms: number) => {
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current)
    finishTimerRef.current = window.setTimeout(finish, ms + FINISH_GRACE_MS)
  }

  const comeOff = (now: number) => {
    const s = sim.current
    if (s.mode === 'fly' || s.mode === 'done') return
    const scripted = s.mode === 'script'
    s.torn = 1
    s.pointerId = null
    s.mode = 'fly'
    s.elapsed = 0
    setAway(true)
    setLeaving(true)
    finishWithin(s.reduced ? FADE_MS : FLY_MS)
    // The last fibres snap: a stronger pulse than the holes.
    s.lastBuzz = -Infinity
    buzz(SNAP_BUZZ_MS, now)
    if (s.reduced) return
    // Keep the throw of the hand: the stub flies off the way it was pulled, still turning.
    const v = scripted ? { x: -s.dir * 0.1, y: 0.6 } : velocity()
    s.vx = clamp(v.x * 0.7, -1.2, 1.2)
    s.vy = clamp(v.y * 0.7, 0.35, 2)
    // At most about a third of a turn over the whole fall.
    s.spin = -s.dir * clamp(Math.abs(s.angleV), 0.04, 0.18)
    // The free corner keeps coming up as the hinge lets go.
    s.lift = s.dir * Math.min(Math.abs(s.angle) / 30, 1) * LIFT_DEG
    s.liftV = s.dir * 0.06
    // The ticket gives a small jolt when the stub lets go of it.
    rootRef.current?.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-4px)' },
        { transform: 'translateY(0)' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
    )
  }

  /** Speed of the pointer over its last moves; 0 when it has been still (no recent moves). */
  const velocity = () => {
    const now = performance.now()
    const samples = sim.current.samples.filter((sample) => now - sample.t <= VELOCITY_WINDOW_MS)
    if (samples.length < 2) return { x: 0, y: 0 }
    const first = samples[0]
    const last = samples[samples.length - 1]
    const dt = Math.max(last.t - first.t, 1)
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt }
  }

  /** Moves the stub for a pull of `pull` px down and `dx` px sideways, and tears on. */
  const applyPull = (pull: number, dx: number, now: number, dt: number) => {
    const s = sim.current
    const progress = Math.min(pull / TEAR_THRESHOLD_PX, 1)
    const before = s.angle
    if (s.reduced) {
      s.angle = 0
      s.tx = 0
      s.ty = pull
    } else {
      const open = Math.atan2(pull * PAPER_GIVE, s.lever) * DEG
      // Tearing new paper: each hole holds the stub back, then lets it jump on.
      const stick =
        progress > s.torn && progress < 1 ? ((progress * PERFORATION_HOLES) % 1) * STICK_DEG : 0
      s.angle = -s.dir * clamp(open - stick, 0, MAX_ANGLE_DEG)
      // The paper stretches a little before it gives.
      s.tx = clamp(dx * STRETCH, -10, 10)
      s.ty = Math.min(pull * 0.05, 5)
    }
    if (dt > 0) s.angleV = s.angleV * 0.6 + ((s.angle - before) / dt) * 0.4
    if (progress > s.torn) {
      const holes = Math.floor(progress * PERFORATION_HOLES)
      if (holes > s.holes) {
        s.holes = holes
        buzz(HOLE_BUZZ_MS, now)
      }
      s.torn = progress
    }
    if (s.torn >= 1) comeOff(now)
  }

  /** Pull (px) that puts the stub where it is now, so a stub caught on its way back does not jump. */
  const currentPull = () => {
    const s = sim.current
    if (s.reduced) return s.ty
    return (Math.tan(Math.abs(s.angle) / DEG) * s.lever) / PAPER_GIVE
  }

  const step = (now: number) => {
    const s = sim.current
    const dt = Math.min(now - s.lastFrame, 32)
    s.lastFrame = now
    switch (s.mode) {
      case 'drag':
        applyPull(Math.max(0, s.py - s.y0), s.px - s.x0, now, dt)
        // Pulled far enough: it came off and falls on by itself.
        return modeNow() === 'fly'
      case 'script': {
        s.elapsed += dt
        const t = Math.min(s.elapsed / SCRIPT_MS, 1)
        // Slow at first, then the perforation runs: ease-in.
        const pull = s.scriptFrom + (TEAR_THRESHOLD_PX - s.scriptFrom) * t ** 1.7
        applyPull(pull, 0, now, dt)
        return true
      }
      case 'spring': {
        const spring = (x: number, v: number) => {
          const next = v + (-SPRING_K * x - SPRING_C * v) * dt
          return [x + next * dt, next] as const
        }
        ;[s.angle, s.angleV] = spring(s.angle, s.angleV)
        ;[s.tx, s.txV] = spring(s.tx, s.txV)
        ;[s.ty, s.tyV] = spring(s.ty, s.tyV)
        // The stub cannot swing into the ticket: it knocks against it and bounces back a little.
        if (s.angle * s.dir > 0 || s.ty < 0) {
          if (s.angle * s.dir > 0) {
            s.angle = 0
            s.angleV = -s.angleV * 0.35
          }
          if (s.ty < 0) {
            s.ty = 0
            s.tyV = -s.tyV * 0.35
          }
          if (!s.bumped) {
            s.bumped = true
            buzz(BUMP_BUZZ_MS, now)
          }
        }
        const still =
          Math.abs(s.angle) < 0.05 &&
          Math.abs(s.tx) < 0.05 &&
          Math.abs(s.ty) < 0.05 &&
          Math.abs(s.angleV) + Math.abs(s.txV) + Math.abs(s.tyV) < 0.003
        if (still) {
          s.angle = s.tx = s.ty = s.angleV = s.txV = s.tyV = 0
          s.mode = 'home'
          setAway(false)
          return false
        }
        return true
      }
      case 'fly':
        s.elapsed += dt
        if (!s.reduced) {
          s.vy += (GRAVITY - AIR_DRAG * s.vy) * dt
          s.vx *= 1 - 0.002 * dt
          // Drifts to one side and back as it flutters.
          const sway = Math.cos(s.elapsed * FLUTTER_PER_MS) * SWAY_PX_PER_MS
          s.tx += (s.vx + sway * s.dir) * dt
          s.ty += s.vy * dt
          s.angle += s.spin * dt
          s.spin *= 1 - 0.0015 * dt
          s.lift = clamp(s.lift + s.liftV * dt, -60, 60)
          s.liftV *= 1 - 0.004 * dt
        }
        if (s.elapsed >= (s.reduced ? FADE_MS : FLY_MS)) {
          finish()
          return false
        }
        return true
      default:
        return false
    }
  }

  const tick = (now: number) => {
    frameRef.current = null
    const more = step(now)
    paint()
    if (more) requestFrame()
  }

  const requestFrame = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick)
  }

  const backHome = () => {
    const s = sim.current
    if (s.reduced) {
      // No spring for reduced motion: the stub is home at once.
      s.angle = s.tx = s.ty = s.angleV = 0
      s.mode = 'home'
      setAway(false)
      paint()
      return
    }
    s.mode = 'spring'
    s.txV = s.tyV = 0
    s.bumped = false
    s.lastFrame = performance.now()
    requestFrame()
  }

  const grab = (clientX: number) => {
    const s = sim.current
    const rect = rootRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 300
    const x = clientX - (rect?.left ?? 0)
    // A fresh stub tears from the side it is held at; a cracked one keeps tearing the same way.
    if (s.torn === 0 && s.mode === 'home') s.dir = x < width / 2 ? 1 : -1
    const pivotX = s.dir === 1 ? width : 0
    const pull = currentPull()
    s.lever = Math.max(Math.abs(x - pivotX), width * 0.35)
    return pull
  }

  const tear = () => {
    const s = sim.current
    if (s.mode === 'drag' || s.mode === 'script' || s.mode === 'fly' || s.mode === 'done') return
    s.reduced = prefersReducedMotion()
    const now = performance.now()
    s.lastFrame = now
    setAway(true)
    setLeaving(true)
    if (s.reduced) {
      comeOff(now)
    } else {
      finishWithin(SCRIPT_MS + FLY_MS)
      const rect = rootRef.current?.getBoundingClientRect()
      const width = rect?.width ?? 300
      // Held near the free corner, as a hand would.
      grab((rect?.left ?? 0) + (s.dir === 1 ? width * 0.2 : width * 0.8))
      s.scriptFrom = currentPull()
      s.elapsed = 0
      s.mode = 'script'
    }
    requestFrame()
  }

  const release = (event: PointerEvent<HTMLElement>, letGo: boolean, now: number) => {
    const s = sim.current
    if (event.pointerId !== s.pointerId) return
    s.pointerId = null
    if (s.mode !== 'drag') return
    // A cancelled pointer does not report a usable position: keep the last move then.
    if (letGo) {
      s.px = event.clientX
      s.py = event.clientY
      record(event.clientX, event.clientY)
      applyPull(Math.max(0, s.py - s.y0), s.px - s.x0, now, 0)
    }
    const v = velocity()
    if (
      modeNow() === 'drag' &&
      letGo &&
      !s.reduced &&
      v.y > FLICK_SPEED &&
      s.torn > FLICK_MIN_TORN
    ) {
      comeOff(now)
    }
    if (modeNow() === 'fly') {
      requestFrame()
    } else {
      // Let go too early (or the browser took the touch away): back to its place.
      backHome()
    }
  }

  const record = (x: number, y: number) => {
    const samples = sim.current.samples
    const t = performance.now()
    samples.push({ t, x, y })
    while (samples.length > 2 && t - samples[0].t > VELOCITY_WINDOW_MS) samples.shift()
  }

  const stubHandlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      const s = sim.current
      if (s.pointerId !== null || (s.mode !== 'home' && s.mode !== 'spring')) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      // Keep getting the moves when the finger leaves the stub.
      event.currentTarget.setPointerCapture(event.pointerId)
      s.reduced = prefersReducedMotion()
      const pull = grab(event.clientX)
      s.pointerId = event.pointerId
      s.x0 = event.clientX - s.tx / STRETCH
      s.y0 = event.clientY - pull
      s.px = s.downX = event.clientX
      s.py = s.downY = event.clientY
      s.samples = []
      record(event.clientX, event.clientY)
      s.dragged = false
      s.mode = 'drag'
      s.lastFrame = performance.now()
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const s = sim.current
      if (event.pointerId !== s.pointerId || s.mode !== 'drag') return
      s.px = event.clientX
      s.py = event.clientY
      record(event.clientX, event.clientY)
      if (Math.hypot(s.px - s.downX, s.py - s.downY) > TAP_SLOP_PX && !s.dragged) {
        s.dragged = true
        setAway(true)
      }
      requestFrame()
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => release(event, true, performance.now()),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => release(event, false, performance.now()),
    // A plain tap (and a screen reader's activation) tears too; the click after a drag does not.
    onClick: () => {
      const s = sim.current
      const dragged = s.dragged
      s.dragged = false
      if (!dragged) tear()
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      tear()
    },
  }

  return { rootRef, stubRef, shadowRef, lightRef, away, leaving, tear, stubHandlers }
}
