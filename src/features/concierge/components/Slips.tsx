import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ConciergeError } from '@/features/concierge/api'
import { serial } from '@/features/concierge/lib/format'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge

/** The visitor's question, filled in like a request form handed to the counter. */
export function RequestSlip({
  text,
  number,
  via,
}: {
  text: string
  number: number
  via: 'text' | 'voice'
}) {
  return (
    <div className="concierge-rise ml-10 self-end">
      <div className="rounded-lg border border-line bg-surface px-4 py-3 shadow-[0_1px_0_rgba(30,34,48,0.06)]">
        <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.16em] text-ink-muted">
          <span>
            {t.request.code} · {t.request.label}
          </span>
          <span>{serial(number)}</span>
          {via === 'voice' && (
            <span className="rounded-sm border border-ink-muted/50 px-1 tracking-normal">
              {t.request.voice}
            </span>
          )}
        </p>
        <p className="mt-1 text-[15px] leading-[1.6] font-bold break-words whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  )
}

/** While the counter is working: a dot-matrix "issuing" line. */
export function ThinkingSlip() {
  return (
    <div aria-busy="true" className="concierge-rise flex items-center gap-2 self-start py-1">
      <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-ink-muted">
        {t.thinking}
      </span>
      <span aria-hidden="true" className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="concierge-dot size-1.5 rounded-full bg-ink"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </span>
    </div>
  )
}

/** Seconds left before a rate-limited question may be sent again (counts down to 0). */
function useCountdown(seconds: number | null) {
  const [left, setLeft] = useState(seconds ?? 0)
  useEffect(() => {
    if (!seconds) return
    const endsAt = Date.now() + seconds * 1000
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setLeft(next)
      if (next === 0) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [seconds])
  return left
}

function errorMessage(error: ConciergeError) {
  switch (error.kind) {
    case 'rateLimited':
      return t.errors.rateLimited(error.retryAfter)
    case 'invalid':
      return t.errors.invalid
    case 'unavailable':
      return t.errors.unavailable
    case 'notRecognized':
      return t.errors.notRecognized
    case 'audio':
      return t.errors.audio
    case 'failed':
      return t.errors.failed
  }
}

/** A failed request, printed like a void slip with what to do next. */
export function ErrorSlip({
  error,
  canRetry,
  onRetry,
}: {
  error: ConciergeError
  canRetry: boolean
  onRetry: () => void
}) {
  const waitLeft = useCountdown(error.kind === 'rateLimited' ? error.retryAfter : null)
  return (
    <div
      role="alert"
      className="concierge-rise self-start rounded-lg border border-dashed border-danger/60 bg-surface px-4 py-3"
    >
      <p className="text-sm leading-[1.6] font-bold text-danger">{errorMessage(error)}</p>
      {(canRetry || error.kind === 'unavailable') && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canRetry && error.kind !== 'unavailable' && error.kind !== 'invalid' && (
            <button
              type="button"
              onClick={onRetry}
              disabled={waitLeft > 0}
              className="min-h-10 rounded-full bg-ink px-4 text-[13px] font-bold text-surface active:scale-[0.97] disabled:opacity-40"
            >
              {waitLeft > 0 ? t.errors.retryIn(waitLeft) : t.errors.retry}
            </button>
          )}
          {error.kind === 'unavailable' && (
            <Link
              to="/search"
              className="flex min-h-10 items-center rounded-full border border-ink/30 px-4 text-[13px] font-bold"
            >
              {t.errors.search}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
