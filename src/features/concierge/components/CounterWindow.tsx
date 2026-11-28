import { Clerk } from '@/features/concierge/components/Clerk'
import type { ClerkMood } from '@/features/concierge/hooks/useConciergeChat'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge

/** Departure-board style strip that tells what the clerk is doing. */
function StatusBoard({ mood }: { mood: ClerkMood }) {
  const status = t.status[mood]
  const live = mood === 'listening' || mood === 'thinking'
  return (
    <div
      role="status"
      className="flex min-h-9 items-center gap-2 overflow-hidden rounded-md bg-ink px-3 [perspective:400px]"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${live ? 'concierge-dot bg-[#f3b13c]' : 'bg-[#5ad19a]'}`}
      />
      <span key={mood} className="concierge-flap flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#f3b13c]">
          {status.code}
        </span>
        <span className="truncate text-[13px] font-bold text-[#fbe9c4]">{status.text}</span>
      </span>
    </div>
  )
}

/**
 * The ticket counter at the top of S16. Large on the first visit; once the conversation
 * starts it shrinks to one row so the tickets get the room, and stays pinned under the top bar.
 */
export function CounterWindow({ mood, compact }: { mood: ClerkMood; compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-t-full border border-line bg-gradient-to-b from-[#dfe6e4] to-surface">
          <Clerk mood={mood} size={52} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[9px] font-semibold tracking-[0.16em] text-ink-muted">
            {t.signCode} · {t.sign}
          </p>
          <StatusBoard mood={mood} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Station sign */}
      <div className="flex items-baseline gap-2 rounded-sm bg-ink px-3 py-1.5 text-surface">
        <span className="font-mincho text-base font-extrabold tracking-[0.12em]">{t.sign}</span>
        <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#f3b13c]">
          {t.signCode}
        </span>
      </div>

      {/* Arched window with the clerk behind the counter */}
      <div className="relative mt-3 flex h-[168px] w-[220px] items-end justify-center overflow-hidden rounded-t-full border-2 border-line bg-gradient-to-b from-[#dfe6e4] via-[#ebeee8] to-surface">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line/60" />
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-line/60" />
        <div className="relative translate-y-2">
          <Clerk mood={mood} size={140} />
        </div>
        <p className="sr-only">{t.clerk}</p>
      </div>
      {/* Counter shelf with the ticket slot */}
      <div className="relative h-4 w-[260px] rounded-sm bg-[#b9a684] shadow-[0_3px_0_#8f7d5c]">
        <div className="absolute top-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-ink/70" />
      </div>

      <div className="mt-5 w-full">
        <StatusBoard mood={mood} />
      </div>
      <p className="mt-4 text-left text-sm leading-[1.65] text-ink-muted">{t.lead}</p>
    </div>
  )
}
