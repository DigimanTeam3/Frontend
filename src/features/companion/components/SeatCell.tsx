import { useEffect, useState } from 'react'
import { ja } from '@/shared/i18n/ja'

const PRINT_DELAY_MS = 350
const PRINT_STEP_MS = 160

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export interface SeatCellProps {
  seat: string
  /** null = empty seat. */
  name: string | null
  isMe?: boolean
}

/**
 * One seat on the companion ticket. A name that arrives after the seat is on screen
 * (someone was just matched) is printed letter by letter; names present on first render show at once.
 */
export function SeatCell({ seat, name, isMe = false }: SeatCellProps) {
  const letters = name ? Array.from(name) : []
  const [typed, setTyped] = useState(letters.length)
  // With reduced motion the name appears at once.
  const printed = prefersReducedMotion() ? letters.length : typed
  const printing = printed < letters.length

  useEffect(() => {
    if (!printing) return
    const timer = window.setTimeout(
      () => setTyped((count) => count + 1),
      printed === 0 ? PRINT_DELAY_MS : PRINT_STEP_MS,
    )
    return () => window.clearTimeout(timer)
  }, [printing, printed])

  if (!name) {
    return (
      <div className="flex h-16 flex-col justify-between rounded-lg border border-dashed border-ink/30 p-2">
        <span className="font-mono text-[11px] text-ink-muted">{seat}</span>
        <span className="text-sm text-ink-muted">{ja.companionDetail.seatEmpty}</span>
      </div>
    )
  }

  return (
    <div
      className={`flex h-16 flex-col justify-between rounded-lg border p-2 transition-colors duration-500 ${
        isMe ? 'border-gate bg-gate-soft' : 'border-ink/40 bg-surface'
      }`}
    >
      <span className="font-mono text-[11px] text-ink-muted">
        {seat}
        {isMe && <span className="ml-1 text-gate-ink">{ja.companionDetail.you}</span>}
      </span>
      <span className="truncate font-bold" aria-label={name}>
        {letters.slice(0, printed).join('')}
        {printing && (
          <span aria-hidden className="ml-px animate-pulse text-gate">
            |
          </span>
        )}
      </span>
    </div>
  )
}
