// Small line icons for S16 (24px grid, current color).
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function MicIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  )
}

export function StopIcon() {
  return (
    <svg {...base}>
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  )
}

export function SendIcon() {
  return (
    <svg {...base}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  )
}

export function SpeakerIcon({ active }: { active: boolean }) {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {active ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7" />}
    </svg>
  )
}
