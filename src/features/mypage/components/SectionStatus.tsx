import type { ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'

export interface SectionLoadingProps {
  /** Grey shapes that look like the loaded content. */
  children: ReactNode
}

// Small skeleton of one section that is still loading, so the rest of My Page is not blocked.
export function SectionLoading({ children }: SectionLoadingProps) {
  return (
    <div role="status" aria-busy="true" className="motion-safe:animate-pulse">
      <span className="sr-only">{ja.state.loading}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export interface SectionErrorProps {
  onRetry: () => void
}

// One line for a section that could not load, with a retry button.
export function SectionError({ onRetry }: SectionErrorProps) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-[13px] leading-[1.6] text-ink-muted">{ja.myPage.sectionError}</p>
      <button
        type="button"
        onClick={onRetry}
        className="-my-2 shrink-0 px-2 py-2 text-[13px] leading-[1.6] font-bold text-ink underline"
      >
        {ja.state.retry}
      </button>
    </div>
  )
}
