import { useEffect, useRef, useState } from 'react'
import { splitJamo } from '@/features/events/lib/hangul'
import { ja } from '@/shared/i18n/ja'

// Cards whose title already turned into Japanese in this visit. Coming back to home does not replay.
const playedEventIds = new Set<number>()

// Timeline from the Figma motion memo (S02-k1 → k4).
const KOREAN_HOLD = 300 // k1: show the Korean title as is
const SCATTER_END = 700 // k2: syllables fall apart into letters
const GATHER_END = 1100 // k3: letters gather and the Japanese title prints
const CAPTION_FADE = 200 // k4: the original title stays small below
const PRINT_STEP = 40
const PRINT_DURATION = 160
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'

type Phase = 'korean' | 'playing' | 'done'

// Same scatter every time for the same card (stable screenshots, no flicker on re-render).
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Small offsets so the letters of one syllable start roughly where they sit in the syllable.
const JAMO_OFFSET = [
  [0, 0],
  [9, 2],
  [4, 11],
]

export interface TicketTitleProps {
  eventId: number
  title: string
  titleJa: string | null
  /** True once the card is on screen; starts the animation. */
  visible: boolean
}

// Ticket title: the Korean title falls apart into letters and is printed again in Japanese
// (Figma: Concept 切符 / S02-k1〜k4). Plays once per card, the first time it comes into view.
export function TicketTitle({ eventId, title, titleJa, visible }: TicketTitleProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(() =>
    titleJa === null || playedEventIds.has(eventId) ? 'done' : 'korean',
  )

  // Start once the card comes into view. Reduced motion: no letters flying around,
  // the Japanese title just fades in (CSS transition).
  if (visible && phase === 'korean') {
    setPhase(prefersReducedMotion() || !('animate' in Element.prototype) ? 'done' : 'playing')
  }

  useEffect(() => {
    if (phase !== 'korean') playedEventIds.add(eventId)
  }, [phase, eventId])

  useEffect(() => {
    const stage = stageRef.current
    if (phase !== 'playing' || !stage) return
    const animations = playTitle(stage, eventId)
    const timer = window.setTimeout(() => setPhase('done'), GATHER_END + CAPTION_FADE + 100)
    return () => {
      window.clearTimeout(timer)
      animations.forEach((a) => a.cancel())
    }
  }, [phase, eventId])

  if (titleJa === null) {
    return (
      <div className="flex min-h-[58px] flex-col gap-0.5">
        <h2 lang="ko" className="line-clamp-2 font-serif text-[22px]/[1.3] font-bold break-keep">
          {title}
        </h2>
        <p className="text-[10px]/[1.4] text-ink-muted">{ja.ticket.noTranslation}</p>
      </div>
    )
  }

  const showKorean = phase !== 'done'
  const syllables = [...title]
  const jaChars = [...titleJa]

  return (
    <div ref={stageRef} className="relative flex min-h-[58px] flex-col gap-1">
      <h2
        className={`line-clamp-2 font-mincho text-2xl/[1.3] font-extrabold tracking-[0.02em] [word-break:auto-phrase] transition-opacity duration-200 ${
          phase === 'korean' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* One box per character only while printing; plain text otherwise so lines break by phrase. */}
        {phase === 'playing'
          ? jaChars.map((char, i) =>
              char.trim() ? (
                <span key={i} data-ja-char className="inline-block">
                  {char}
                </span>
              ) : (
                char
              ),
            )
          : titleJa}
      </h2>
      <p
        data-caption
        className={`truncate text-[10px]/[1.4] tracking-[0.04em] text-ink-faint transition-opacity duration-200 ${
          showKorean ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {ja.ticket.originalTitle}
        <span lang="ko" className="ml-2">
          {title}
        </span>
      </p>

      {/* Korean title shown first, then split into letters. Decoration: the h2 holds the real title. */}
      {showKorean && (
        <p
          aria-hidden="true"
          lang="ko"
          className="pointer-events-none absolute inset-x-0 top-0.5 line-clamp-2 font-serif text-[22px]/[1.3] font-bold break-keep"
        >
          {syllables.map((syllable, i) => (
            <span key={i} data-syllable className="relative">
              <span data-syllable-face>{syllable}</span>
              {phase === 'playing' &&
                splitJamo(syllable).map((jamo, j) => (
                  <span
                    key={j}
                    data-jamo
                    className="absolute top-0 left-0 text-base font-bold opacity-0"
                    style={{ translate: `${JAMO_OFFSET[j][0]}px ${JAMO_OFFSET[j][1]}px` }}
                  >
                    {jamo}
                  </span>
                ))}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

function playTitle(stage: HTMLElement, eventId: number): Animation[] {
  const animations: Animation[] = []
  const faces = [...stage.querySelectorAll<HTMLElement>('[data-syllable-face]')]
  const syllables = [...stage.querySelectorAll<HTMLElement>('[data-syllable]')]
  const jaChars = [...stage.querySelectorAll<HTMLElement>('[data-ja-char]')]
  const caption = stage.querySelector<HTMLElement>('[data-caption]')

  // k2: each syllable gives way to its letters.
  faces.forEach((face) =>
    animations.push(
      face.animate([{ opacity: 1 }, { opacity: 0 }], {
        delay: KOREAN_HOLD,
        duration: 60,
        fill: 'forwards',
      }),
    ),
  )

  let letterIndex = 0
  syllables.forEach((syllable, s) => {
    const from = syllable.getBoundingClientRect()
    // Letters of this syllable gather at the Japanese character in the same relative position.
    const target = jaChars[Math.floor((s / syllables.length) * jaChars.length)]
    const to = target?.getBoundingClientRect() ?? from
    const toX = to.left - from.left + 4
    const toY = to.top - from.top + 6

    syllable.querySelectorAll<HTMLElement>('[data-jamo]').forEach((jamo) => {
      const seed = eventId * 100 + letterIndex
      const x = (noise(seed) * 2 - 1) * 45
      const y = -26 + noise(seed + 0.5) * 70
      const rotate = (noise(seed + 0.25) * 2 - 1) * 40
      const stagger = Math.min(letterIndex * 7, 120)
      letterIndex += 1
      animations.push(
        jamo.animate(
          [
            { opacity: 1, transform: 'translate(0, 0) rotate(0deg)', easing: EASE_OUT },
            {
              opacity: 1,
              transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
              offset: 0.5,
              easing: EASE_IN_OUT,
            },
            { opacity: 0, transform: `translate(${toX}px, ${toY}px) rotate(0deg) scale(0.6)` },
          ],
          {
            delay: KOREAN_HOLD + stagger,
            duration: GATHER_END - KOREAN_HOLD - stagger,
            fill: 'forwards',
          },
        ),
      )
    })
  })

  // k3: the Japanese title is printed one character at a time.
  const step = Math.min(PRINT_STEP, (GATHER_END - SCATTER_END) / Math.max(jaChars.length, 1))
  jaChars.forEach((char, i) =>
    animations.push(
      char.animate(
        [
          { opacity: 0, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          delay: SCATTER_END + i * step,
          duration: PRINT_DURATION,
          easing: EASE_IN_OUT,
          fill: 'both',
        },
      ),
    ),
  )

  // k4: the original title stays below in small type.
  if (caption) {
    animations.push(
      caption.animate([{ opacity: 0 }, { opacity: 1 }], {
        delay: GATHER_END,
        duration: CAPTION_FADE,
        fill: 'both',
      }),
    )
  }
  return animations
}
