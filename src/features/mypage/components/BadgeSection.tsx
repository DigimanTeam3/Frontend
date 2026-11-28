import { useAllMyBadgesQuery } from '@/features/mypage/api'
import { SectionHead } from '@/features/mypage/components/SectionHead'
import { SectionError } from '@/features/mypage/components/SectionError'
import { SectionLoading } from '@/features/mypage/components/SectionLoading'
import { ja } from '@/shared/i18n/ja'
import type { BadgeType } from '@/shared/types/badge'

// Figma S15 badge stamps: the participation badge is the soft festival circle, the complete one
// the dark circle.
const STAMP_LOOK: Record<BadgeType, string> = {
  participation: 'border-festival bg-festival-soft text-festival',
  complete: 'border-ink bg-ink text-white',
}

const STAMP_BASE =
  'font-mincho flex size-16 shrink-0 items-center justify-center rounded-full border-2 text-xl leading-[1.3] font-extrabold tracking-[0.01em]'

// The badges I earned, as a row of stamps that scrolls inside itself, ending in a dashed "?".
export function BadgeSection() {
  const { badges: copy } = ja.myPage
  const { data, isPending, isError, refetch } = useAllMyBadgesQuery()
  // In the order they were earned.
  const badges = data?.items.toSorted(
    (a, b) => a.acquiredAt.localeCompare(b.acquiredAt) || a.id - b.id,
  )

  return (
    <section className="flex flex-col gap-6">
      <SectionHead
        title={copy.title}
        // TODO(api): the Figma shows "4 / 12"; the API has no total number of badges, so only the
        // earned count is shown.
        trailing={
          data && (
            <span className="font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em] text-ink-faint">
              {copy.count(data.total)}
            </span>
          )
        }
      />
      {isPending && (
        <SectionLoading>
          <div className="flex gap-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="size-16 shrink-0 rounded-full bg-ink/5" />
            ))}
          </div>
        </SectionLoading>
      )}
      {isError && <SectionError onRetry={() => void refetch()} />}
      {badges && (
        <div className="flex flex-col gap-3">
          {/* Stretched over the page padding (the layout's gutter token, or the 16px of the
              layout that has no token yet), so the row scrolls up to the screen edge. It is a
              scroll area: focusable so the keyboard can scroll it. */}
          <ul
            aria-label={copy.listLabel}
            tabIndex={0}
            className="-mx-[var(--spacing-gutter,16px)] flex [scrollbar-width:none] gap-3 overflow-x-auto px-[var(--spacing-gutter,16px)]"
          >
            {badges.map((badge) => (
              <li key={badge.id} className="shrink-0">
                <span
                  role="img"
                  aria-label={
                    badge.event
                      ? copy.name[badge.badgeType](badge.event.titleJa ?? badge.event.title)
                      : copy.nameOnly[badge.badgeType]
                  }
                  className={`${STAMP_BASE} ${STAMP_LOOK[badge.badgeType]}`}
                >
                  {copy.label[badge.badgeType]}
                </span>
              </li>
            ))}
            <li className="shrink-0">
              <span
                role="img"
                aria-label={copy.placeholder}
                className={`${STAMP_BASE} border-dashed border-line bg-ink/5 text-ink-faint`}
              >
                {copy.placeholderMark}
              </span>
            </li>
          </ul>
          {badges.length === 0 && (
            <p className="text-[13px] leading-[1.6] text-ink-muted">{copy.empty}</p>
          )}
        </div>
      )}
    </section>
  )
}
