import { categoryLabel } from '@/shared/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import type { EventCategory } from '@/shared/types/event'

export type CategoryFilter = EventCategory | 'all'

const FILTERS: CategoryFilter[] = ['all', 'festival', 'exhibition', 'performance']

const DOT: Record<EventCategory, string> = {
  festival: 'bg-festival',
  exhibition: 'bg-exhibit',
  performance: 'bg-stage',
}

export interface CategoryChipsProps {
  value: CategoryFilter
  counts: Record<CategoryFilter, number>
  onChange: (value: CategoryFilter) => void
}

/** すべて / 祭り / 展示 / 公演 with counts. Filters the pins and the tickets together. */
export function CategoryChips({ value, counts, onChange }: CategoryChipsProps) {
  return (
    <div role="group" aria-label={ja.map.filterLabel} className="flex gap-2 overflow-x-auto">
      {FILTERS.map((filter) => {
        const active = filter === value
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold shadow-[0_2px_8px_rgb(30_34_48/0.12)] transition-colors duration-150 ${
              active ? 'bg-ink text-surface' : 'bg-surface text-ink'
            }`}
          >
            {filter !== 'all' && (
              <span aria-hidden className={`size-2 rounded-full ${DOT[filter]}`} />
            )}
            {filter === 'all' ? ja.map.all : categoryLabel(filter)}
            <span
              className={`font-mono text-[10px] ${active ? 'text-surface/70' : 'text-ink-muted'}`}
            >
              {counts[filter]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
