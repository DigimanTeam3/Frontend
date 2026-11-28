import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { saveCondition } from '@/features/concierge/api'
import { BellIcon } from '@/features/concierge/components/icons'
import { conditionLabels } from '@/features/concierge/lib/format'
import {
  keepPendingReservation,
  toTicketCreateRequest,
} from '@/features/concierge/lib/savedCondition'
import { queryKeys } from '@/shared/api/queryKeys'
import { ja } from '@/shared/i18n/ja'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ConciergeConditions } from '@/shared/types/concierge'

const t = ja.concierge.voice.reservation

/**
 * Nothing matched: keep the conditions as a 予約券 (S17) and hear about new events on LINE.
 * Logged in → saved here. Logged out → login first; the voice counter offers it again on return.
 * `trailing` sits beside the main button (the small mic).
 */
export function ReservationCard({
  conditions,
  trailing,
}: {
  conditions: ConciergeConditions
  trailing?: ReactNode
}) {
  const isLoggedIn = useAuthStore((state) => state.accessToken !== null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: () => saveCondition(toTicketCreateRequest(conditions, t.noConditions)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
  })
  const labels = conditionLabels(conditions)

  const onMain = () => {
    if (!isLoggedIn) {
      keepPendingReservation(conditions)
      navigate(`/login?redirect=${encodeURIComponent('/concierge')}`)
      return
    }
    if (!save.isPending) save.mutate()
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
        {save.isSuccess && (
          <p role="status" className="mt-2 text-[13px] leading-[1.6] font-bold">
            {t.saved}
          </p>
        )}
        {save.isError && (
          <p role="alert" className="mt-2 text-[13px] leading-[1.6] font-bold text-danger">
            {t.failed}
          </p>
        )}
      </section>

      {/* Main button, pinned above the home indicator (Figma: pink button at the bottom). */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-auto flex items-center gap-2 bg-[var(--digu-bg)] px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {save.isSuccess ? (
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
            aria-busy={save.isPending}
            className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center rounded-[14px] bg-[var(--digu-pink)] px-4 text-center text-[15px] leading-[1.4] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
          >
            {!isLoggedIn ? t.login : save.isPending ? t.saving : save.isError ? t.retry : t.cta}
          </button>
        )}
        {trailing}
      </div>
    </>
  )
}
