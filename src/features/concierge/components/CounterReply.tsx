import { Link } from 'react-router'
import { EventTicket } from '@/features/concierge/components/EventTicket'
import { SpeakerIcon } from '@/features/concierge/components/icons'
import type { ReservationStatus } from '@/features/concierge/hooks/useConciergeSession'
import { conditionLabels } from '@/features/concierge/lib/format'
import { offersReservation, validRecommendations } from '@/features/concierge/lib/reply'
import { saveReservationConditions } from '@/features/concierge/lib/reservationDraft'
import { ja } from '@/shared/i18n/ja'
import type { ConciergeConditions, ConciergeReply } from '@/shared/types/concierge'

const t = ja.concierge

// Time between tickets coming out of the slot, and how long one takes to print.
const PRINT_STAGGER_MS = 380
const PRINT_MS = 640

/** Reply text as plain React text: one block per line, no HTML or markdown. */
function ReplyText({ text }: { text: string }) {
  return (
    <p className="text-[15px] leading-[1.7]">
      {text.split('\n').map((line, i) => (
        <span key={i} className="block min-h-[1lh] break-words">
          {line}
        </span>
      ))}
    </p>
  )
}

function ConditionsLine({ conditions }: { conditions: ConciergeConditions }) {
  const labels = conditionLabels(conditions)
  if (labels.length === 0) return null
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">
        {t.reply.conditions}
      </span>
      {labels.map((label, i) => (
        <span
          key={`${label}-${i}`}
          className="rounded-sm border border-ink/25 px-1.5 py-px text-[11px] font-bold text-ink-muted"
        >
          {label}
        </span>
      ))}
    </p>
  )
}

/**
 * Offered when nothing matched: keep the conditions as a 予約券 (S17). When the voice counter
 * already saved (or is saving) this reply's 予約券, the link only opens the list, so the same
 * conditions are not handed over a second time.
 */
function ReservationOffer({
  conditions,
  status,
}: {
  conditions: ConciergeConditions
  status: ReservationStatus
}) {
  const kept = status === 'saved' || status === 'saving'
  const linkClass =
    'mt-3 flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-bold text-surface transition-transform duration-150 ease-out active:scale-[0.97]'
  return (
    <div className="concierge-rise rounded-xl border-2 border-dashed border-ink/30 bg-surface px-4 py-3.5">
      <p className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">{t.reservation.code}</p>
      <p className="font-mincho text-lg font-extrabold">{t.reservation.title}</p>
      <p
        role={kept ? 'status' : undefined}
        className="mt-1 text-[13px] leading-[1.6] text-ink-muted"
      >
        {status === 'saved'
          ? t.reservation.saved
          : status === 'saving'
            ? t.voice.reservation.saving
            : t.reservation.body}
      </p>
      {kept ? (
        <Link to="/me/tickets" className={linkClass}>
          {t.reservation.open}
        </Link>
      ) : (
        <Link
          to="/me/tickets"
          state={{ conciergeConditions: conditions }}
          onClick={() => saveReservationConditions(conditions)}
          className={linkClass}
        >
          {t.reservation.cta}
        </Link>
      )}
    </div>
  )
}

export interface CounterReplyProps {
  reply: ConciergeReply
  /** Only the newest reply shows its quick-reply chips. */
  showSuggestions: boolean
  disabled: boolean
  onSuggestion: (text: string) => void
  speaking: boolean
  /** null when the browser cannot read aloud. */
  onToggleSpeech: (() => void) | null
  /** The 予約券 of this reply, if the voice counter already saved it. */
  reservationStatus: ReservationStatus
}

/** The counter's answer: text, then tickets printed out of the slot one by one. */
export function CounterReply({
  reply,
  showSuggestions,
  disabled,
  onSuggestion,
  speaking,
  onToggleSpeech,
  reservationStatus,
}: CounterReplyProps) {
  const recommendations = validRecommendations(reply)
  const suggestions = reply.suggestions.filter((s) => s.trim()).slice(0, 4)

  return (
    <div className="concierge-rise flex flex-col gap-3 self-stretch">
      <div className="mr-6 rounded-lg bg-ink/[0.04] px-4 py-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-mono text-[9px] tracking-[0.16em] text-ink-muted">
            {t.reply.code} · {t.reply.label}
          </p>
          {onToggleSpeech && (
            <button
              type="button"
              onClick={onToggleSpeech}
              aria-pressed={speaking}
              aria-label={speaking ? t.reply.stopSpeaking : t.reply.speak}
              className="-my-2 -mr-2 flex size-9 items-center justify-center rounded-full text-ink-muted active:bg-ink/10"
            >
              <SpeakerIcon active={speaking} />
            </button>
          )}
        </div>
        <ReplyText text={reply.reply} />
        <ConditionsLine conditions={reply.conditions} />
      </div>

      {recommendations.length > 0 && (
        <section aria-label={t.reply.issued(recommendations.length)}>
          {/* The slot the tickets come out of */}
          <div
            aria-hidden="true"
            className="relative z-[1] mx-3 h-2.5 rounded-full bg-ink shadow-[inset_0_-2px_0_rgba(255,255,255,0.12)]"
          />
          <ol className="-mt-1 flex flex-col gap-3 px-1">
            {recommendations.map((item, i) => (
              <li key={item.event.id} className="overflow-hidden pt-1">
                <div
                  className="concierge-print"
                  style={{ animationDelay: `${i * PRINT_STAGGER_MS}ms` }}
                >
                  <EventTicket
                    recommendation={item}
                    revealDelay={i * PRINT_STAGGER_MS + PRINT_MS}
                  />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-center font-mono text-[10px] tracking-[0.12em] text-ink-muted">
            {t.reply.issued(recommendations.length)}
          </p>
        </section>
      )}

      {offersReservation(reply) && (
        <ReservationOffer conditions={reply.conditions} status={reservationStatus} />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.16em] text-ink-muted">
            {t.reply.suggestionsLabel}
          </p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSuggestion(suggestion)}
                  className="min-h-10 rounded-full border border-ink/30 bg-surface px-3.5 text-[13px] font-bold transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
