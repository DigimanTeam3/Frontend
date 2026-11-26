import { SeatCell } from '@/features/companion/components/SeatCell'
import { formatMeetAt } from '@/features/companion/formatMeetAt'
import { ja } from '@/shared/i18n/ja'
import type { CompanionPostDetail } from '@/shared/types/companion'

const SEAT_LETTERS = ['A', 'B', 'C', 'D']
const text = ja.companionDetail

/** The companion ticket (切符). Matched people's names are printed in the seat cells. */
export function KippuTicket({ post }: { post: CompanionPostDetail }) {
  const seats = Array.from({ length: post.capacity }, (_, index) => ({
    label: `1${SEAT_LETTERS[index] ?? index + 1}`,
    member: post.members[index] ?? null,
  }))

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="px-5 pt-4 pb-5">
        <p className="flex justify-between font-mono text-xs text-ink-muted">
          <span>{text.ticketLabel}</span>
          <span>{text.ticketNo(post.id)}</span>
        </p>
        <h2 className="mt-1 text-lg leading-snug font-bold">
          {post.event.titleJa ?? post.event.title}
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-muted">{text.meet}</dt>
          <dd className="font-bold">{formatMeetAt(post.meetAt)}</dd>
          <dt className="text-ink-muted">{text.place}</dt>
          <dd className="font-bold">{post.event.venueNameJa ?? post.event.venueName}</dd>
        </dl>
      </div>

      {/* Perforation: a dashed tear line with punched notches on both edges. */}
      <div aria-hidden className="relative">
        <div className="mx-4 border-t-2 border-dashed border-ink/20" />
        <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-line bg-[var(--color-app,var(--color-surface))]" />
        <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-line bg-[var(--color-app,var(--color-surface))]" />
      </div>

      <div className="px-5 pt-3 pb-5">
        <p className="flex justify-between text-xs text-ink-muted">
          <span>{text.seats}</span>
          <span>{text.members(post.memberCount, post.capacity)}</span>
        </p>
        <ul aria-live="polite" className="mt-2 grid grid-cols-4 gap-2">
          {seats.map(({ label, member }) => (
            <li key={label}>
              <SeatCell
                seat={member?.seat ?? label}
                name={member?.user.nickname ?? null}
                isMe={member?.isMe}
              />
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
