import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { BellIcon } from '@/features/concierge/components/icons'
import type { ReservationStatus } from '@/features/concierge/hooks/useConciergeSession'
import { conditionLabels } from '@/features/concierge/lib/format'
import { keepPendingReservation } from '@/features/concierge/lib/savedCondition'
import { ja } from '@/shared/i18n/ja'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ConciergeConditions } from '@/shared/types/concierge'

const t = ja.concierge.voice.reservation

/**
 * Nothing matched: keep the conditions as a 予約券 (S17) and hear about new events on LINE.
 * Logged in → saved here. Logged out → login first; the voice counter offers it again on return.
 * The save itself lives in the session (`status` / `onSave`), so a saved card stays saved when
 * the views are switched. `trailing` sits beside the main button (the small mic).
 */
export function ReservationCard({
  conditions,
  status,
  onSave,
  trailing,
}: {
  conditions: ConciergeConditions
  status: ReservationStatus
  onSave: () => void
  trailing?: ReactNode
}) {
  const isLoggedIn = useAuthStore((state) => state.accessToken !== null)
  const navigate = useNavigate()
  const labels = conditionLabels(conditions)

  const onMain = () => {
    if (!isLoggedIn) {
      keepPendingReservation(conditions)
      navigate(`/login?redirect=${encodeURIComponent('/concierge')}`)
      return
    }
    if (status !== 'saving') onSave()
  }

  return (
    <>
      <section
        aria-label={t.title}
        className="digu-pop rounded-[14px] border-2 border-dashed border-[var(--digu-ink)]/25 bg-[var(--digu-paper)] px-4 pt-3.5 pb-3"
      >
        <p className="flex items-center gap-1.5">
          <span className="text-[var(--digu-pink)]">
            <BellIcon />
          </span>
          <span className="text-[15px] font-bold">{t.title}</span>
          <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--digu-ink-mute)]">
            {t.code}
          </span>
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {(labels.length > 0 ? labels : [t.noConditions]).map((label, i) => (
            <li
              key={`${label}-${i}`}
              className="rounded-[4px] border-[1.5px] border-[var(--digu-stamp)] px-2 py-0.5 font-mincho text-[15px] leading-[1.4] font-extrabold break-all text-[var(--digu-stamp)]"
            >
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center justify-end border-t border-dashed border-[var(--digu-ink)]/20 pt-2 text-[11px] text-[var(--digu-ink-sub)]">
          {t.notify}
        </p>
        {status === 'saved' && (
          <p role="status" className="mt-2 text-[13px] leading-[1.6] font-bold">
            {t.saved}
          </p>
        )}
        {status === 'failed' && (
          <p role="alert" className="mt-2 text-[13px] leading-[1.6] font-bold text-danger">
            {t.failed}
          </p>
        )}
      </section>

      {/* Main button, pinned above the home indicator (Figma: pink button at the bottom). */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-auto flex items-center gap-2 bg-[var(--digu-bg)] px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {status === 'saved' ? (
          <Link
            to="/me/tickets"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-[14px] bg-[var(--digu-ink)] px-4 text-[15px] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            {t.open}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onMain}
            aria-busy={status === 'saving'}
            className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center rounded-[14px] bg-[var(--digu-pink)] px-4 text-center text-[15px] leading-[1.4] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
          >
            {!isLoggedIn
              ? t.login
              : status === 'saving'
                ? t.saving
                : status === 'failed'
                  ? t.retry
                  : t.cta}
          </button>
        )}
        {trailing}
      </div>
    </>
  )
}
