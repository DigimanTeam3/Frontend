import { ja } from '@/shared/i18n/ja'
import type { CompanionStatus } from '@/shared/types/companion'

const STATUS_CLASS: Record<CompanionStatus, string> = {
  OPEN: 'bg-primary/10 text-primary',
  FULL: 'bg-ink/10 text-ink',
  CLOSED: 'bg-line text-ink-muted',
}

export function StatusTag({ status }: { status: CompanionStatus }) {
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>
      {ja.companion.status[status]}
    </span>
  )
}
