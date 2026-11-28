import { ja } from '@/shared/i18n/ja'
import type { CompanionStatus } from '@/shared/types/companion'

const STATUS_CLASS: Record<CompanionStatus, string> = {
  OPEN: 'bg-gate-soft text-gate',
  FULL: 'bg-ink/10 text-ink',
  CLOSED: 'bg-surface-2 text-ink-faint',
}

export function StatusTag({ status }: { status: CompanionStatus }) {
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-[3px] text-xs/[1.5] font-bold ${STATUS_CLASS[status]}`}
    >
      {ja.companion.status[status]}
    </span>
  )
}
