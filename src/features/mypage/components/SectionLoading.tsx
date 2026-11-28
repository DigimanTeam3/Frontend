import type { ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'

export interface SectionLoadingProps {
  /** Grey shapes that look like the loaded content. */
  children: ReactNode
}

// Small skeleton of one section that is still loading, so the rest of My Page is not blocked.
export function SectionLoading({ children }: SectionLoadingProps) {
  return (
    <div role="status" className="motion-safe:animate-pulse">
      <span className="sr-only">{ja.state.loading}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}
