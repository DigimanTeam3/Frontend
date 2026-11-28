import { ja } from '@/shared/i18n/ja'
import type { MySummary } from '@/shared/types/me'

export interface StatsCardProps {
  summary: MySummary
}

// Three counts in equal columns (Figma: S15 stats): verified events, finished events and
// companion groups (posts I wrote and posts I joined, the same number as the menu row).
export function StatsCard({ summary }: StatsCardProps) {
  const { stats: copy } = ja.myPage
  const items = [
    { label: copy.verified, count: summary.verifiedEventCount },
    { label: copy.complete, count: summary.completeBadgeCount },
    { label: copy.companion, count: summary.companionCount },
  ]

  return (
    <dl className="grid grid-cols-3 rounded-[14px] border border-line bg-surface py-3.5">
      {items.map((item) => (
        // The label comes first for screen readers ("participated 3"); the number is drawn above it.
        <div key={item.label} className="flex flex-col-reverse items-center gap-0.5">
          <dt className="text-xs leading-normal text-ink-muted">{item.label}</dt>
          <dd className="font-mono text-lg leading-[1.2] font-semibold tracking-[0.02em] text-ink">
            {item.count}
          </dd>
        </div>
      ))}
    </dl>
  )
}
