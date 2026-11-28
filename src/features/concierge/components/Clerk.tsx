import type { ClerkMood } from '@/features/concierge/hooks/useConciergeChat'

const INK = '#1e2230'
const FUR = '#fbf7ee'
const MUZZLE = '#fffdf8'
const EAR_INNER = '#e8c9a0'
const BAND = '#c4532f'
const BADGE = '#d9b25b'

// Ears per mood: perked up while listening, drooping when nothing was found.
const EAR_ROTATION: Record<ClerkMood, number> = {
  idle: 0,
  listening: -8,
  thinking: 0,
  speaking: 0,
  clarify: 4,
  notFound: 28,
}

/**
 * The counter clerk 「ディグ」, a Jindo dog in a station cap. Drawn in SVG so each of the six
 * states (idle, listening, thinking, speaking, clarify, notFound) is one prop away.
 * Temporary art until the character design in Figma is final.
 */
export function Clerk({ mood, size }: { mood: ClerkMood; size: number }) {
  const ear = EAR_ROTATION[mood]
  const eyeY = mood === 'thinking' ? 66 : 70
  const eyeShift = mood === 'thinking' ? 2 : 0
  const eyeR = mood === 'listening' ? 4.2 : 3.6

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className="block shrink-0 overflow-visible"
    >
      {/* Uniform */}
      <path d="M26 120 L36 101 Q60 93 84 101 L94 120 Z" fill={INK} />
      <path d="M50 99 L60 112 L70 99 Z" fill={MUZZLE} />
      <circle cx="60" cy="116" r="1.6" fill={BADGE} />

      <g
        transform={mood === 'clarify' ? 'rotate(-8 60 72)' : undefined}
        className={mood === 'speaking' ? 'concierge-bob' : undefined}
      >
        {/* Ears */}
        <g transform={`rotate(${-ear} 36 52)`}>
          <path
            d="M22 60 L26 20 L50 44 Z"
            fill={FUR}
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M28 52 L30 30 L43 44 Z" fill={EAR_INNER} />
        </g>
        <g transform={`rotate(${ear} 84 52)`}>
          <path
            d="M98 60 L94 20 L70 44 Z"
            fill={FUR}
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M92 52 L90 30 L77 44 Z" fill={EAR_INNER} />
        </g>

        {/* Head */}
        <ellipse cx="60" cy="72" rx="34" ry="29" fill={FUR} stroke={INK} strokeWidth="2" />
        <ellipse cx="60" cy="85" rx="16" ry="11" fill={MUZZLE} />
        <circle cx="38" cy="82" r="4" fill={BAND} opacity="0.18" />
        <circle cx="82" cy="82" r="4" fill={BAND} opacity="0.18" />

        {/* Station cap */}
        <path d="M36 49 Q36 30 60 29 Q84 30 84 49 Z" fill={INK} />
        <rect x="36" y="44" width="48" height="5" fill={BAND} />
        <path d="M33 50 Q60 57 87 50 L87 52 Q60 60 33 52 Z" fill={INK} />
        <circle cx="60" cy="38" r="3.4" fill={BADGE} />

        {/* Eyes */}
        {mood === 'notFound' ? (
          <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M43 71 Q47 74 51 71" />
            <path d="M69 71 Q73 74 77 71" />
          </g>
        ) : (
          <g className={mood === 'idle' || mood === 'speaking' ? 'concierge-blink' : undefined}>
            <circle cx={47 + eyeShift} cy={eyeY} r={eyeR} fill={INK} />
            <circle cx={73 + eyeShift} cy={eyeY} r={eyeR} fill={INK} />
          </g>
        )}
        {mood === 'clarify' && (
          <path
            d="M67 61 Q73 57 79 60"
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Nose and mouth */}
        <ellipse cx="60" cy="80" rx="4.5" ry="3.2" fill={INK} />
        {mood === 'speaking' ? (
          <ellipse cx="60" cy="89" rx="4" ry="3.6" fill={BAND} className="concierge-talk" />
        ) : mood === 'notFound' ? (
          <path
            d="M54 90 Q60 86 66 90"
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M54 86 Q60 91 66 86"
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {mood === 'notFound' && (
          <path
            d="M92 58 Q96 64 92 67 Q88 64 92 58 Z"
            fill="#7fb2d8"
            stroke={INK}
            strokeWidth="1"
          />
        )}
      </g>

      {/* Mood marks outside the head */}
      {mood === 'listening' && (
        <g stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M104 34 Q110 42 104 50" className="concierge-wave" />
          <path
            d="M109 28 Q118 42 109 56"
            className="concierge-wave"
            style={{ animationDelay: '0.3s' }}
          />
        </g>
      )}
      {mood === 'thinking' && (
        <g fill={INK}>
          <circle cx="96" cy="22" r="3" className="concierge-dot" />
          <circle
            cx="105"
            cy="16"
            r="3"
            className="concierge-dot"
            style={{ animationDelay: '0.15s' }}
          />
          <circle
            cx="114"
            cy="10"
            r="3"
            className="concierge-dot"
            style={{ animationDelay: '0.3s' }}
          />
        </g>
      )}
      {mood === 'clarify' && (
        <text
          x="100"
          y="30"
          fontFamily="'Shippori Mincho B1', serif"
          fontSize="26"
          fontWeight="800"
          fill={BAND}
        >
          ?
        </text>
      )}
    </svg>
  )
}
