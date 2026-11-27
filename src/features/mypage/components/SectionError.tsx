import { ja } from '@/shared/i18n/ja'

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
