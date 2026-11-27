import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import chevronLeftIcon from '@/shared/ui/icons/chevron-left.svg'
import closeIcon from '@/shared/ui/icons/close.svg'

export interface TopBarProps {
  title?: string
  /** "back" for normal sub screens, "close" for full-screen flows (e.g. the gate scene). */
  leading?: 'back' | 'close'
  /** Where to go when there is no earlier screen in this app (opened from a LINE link or a reload). */
  fallback?: string
  trailing?: ReactNode
}

// Top bar for sub screens (Figma: Concept 切符 / top bar). Sticks to the top below the status bar.
export function TopBar({ title, leading = 'back', fallback = '/', trailing }: TopBarProps) {
  const goBack = useGoBack(fallback)
  const icon = leading === 'close' ? closeIcon : chevronLeftIcon

  return (
    <header className="sticky top-0 z-10 bg-app pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-[52px] items-center gap-1 px-2.5">
        <button
          type="button"
          onClick={goBack}
          aria-label={leading === 'close' ? ja.topBar.close : ja.topBar.back}
          className="flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out active:bg-ink/10"
        >
          <img src={icon} alt="" />
        </button>
        {title && (
          <p className="min-w-0 flex-1 truncate font-mono text-xs font-semibold tracking-[0.12em] text-ink-muted">
            {title}
          </p>
        )}
        {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
      </div>
    </header>
  )
}

// Back and close: go to the previous screen in this app, or to `fallback` when this is the first
// screen opened. Going back (instead of replacing this screen with `fallback`) avoids a duplicate history entry.
// React Router keeps the history position in history.state.idx (0 = first entry of this app,
// also after a redirect with replace, e.g. /me -> /login).
// A flow that must not return to an earlier step on close (e.g. S09 -> S10) moves between its
// steps with replace.
function useGoBack(fallback: string) {
  const navigate = useNavigate()

  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
