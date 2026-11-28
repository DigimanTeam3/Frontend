import happy from '@/features/concierge/assets/digu-happy.jpg'
import idle from '@/features/concierge/assets/digu-idle.jpg'
import listening from '@/features/concierge/assets/digu-listening.jpg'
import speakingHalf from '@/features/concierge/assets/digu-speaking-half.jpg'
import speaking from '@/features/concierge/assets/digu-speaking.jpg'
import thinking from '@/features/concierge/assets/digu-thinking.jpg'

// ディグ (2.5D vinyl-toy Jindo, Figma component 「Jindo Pink」). One picture per expression,
// cut from the Figma state sheet.
const FACES = {
  idle,
  listening,
  thinking,
  speaking,
  speakingHalf,
  happy,
} as const

export type DiguFace = keyof typeof FACES
export type DiguMotion = 'breathe' | 'lean' | 'sniff' | null

const SIZE = {
  // 240px in Figma; smaller on narrow or short screens so ディグ's lines still fit above it
  // (the counter frame keeps the dock under ディグ at a fixed height).
  lg: 'size-[min(240px,64vw,max(150px,calc(100dvh_-_470px)))]',
  sm: 'size-[84px] min-[360px]:size-[104px]',
} as const

const MOTION: Record<Exclude<DiguMotion, null>, string> = {
  breathe: 'digu-breathe',
  lean: 'digu-lean',
  sniff: 'digu-sniff',
}

/**
 * All expressions are stacked and only one is shown, so switching (the mouth moving while
 * ディグ talks) never waits for an image to load. `smooth` cross-fades a new expression; the
 * mouth flap stays instant.
 */
export function Digu({
  face,
  size,
  motion = null,
  smooth = true,
}: {
  face: DiguFace
  size: keyof typeof SIZE
  motion?: DiguMotion
  smooth?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden rounded-full bg-[#f2c6d3] ${SIZE[size]}`}
    >
      <div className={`absolute inset-0 ${motion ? MOTION[motion] : ''}`}>
        {(Object.keys(FACES) as DiguFace[]).map((key) => (
          <img
            key={key}
            src={FACES[key]}
            alt=""
            draggable={false}
            decoding="async"
            className={`absolute inset-0 size-full object-cover ${smooth ? 'transition-opacity duration-200 ease-out motion-reduce:transition-none' : ''} ${key === face ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
    </div>
  )
}
