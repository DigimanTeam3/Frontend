import { Link } from 'react-router'
import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import { StatusTag } from '@/features/companion/components/StatusTag'
import { formatMeetAt } from '@/features/companion/formatMeetAt'
import { ja } from '@/shared/i18n/ja'
import type { CompanionPostSummary } from '@/shared/types/companion'

export interface CompanionCardProps {
  post: CompanionPostSummary
}

export function CompanionCard({ post }: CompanionCardProps) {
  const isOpen = post.status === 'OPEN'
  return (
    <Link
      to={`/companions/${post.id}`}
      className="block rounded-2xl border border-line bg-surface p-4 active:opacity-80"
    >
      <div className="flex items-center gap-3">
        <InitialAvatar name={post.author.nickname} />
        <p className="min-w-0 flex-1 truncate font-bold">{post.author.nickname}</p>
        <StatusTag status={post.status} />
      </div>
      <p className={`mt-3 font-bold break-words ${isOpen ? '' : 'text-ink-muted'}`}>{post.intro}</p>
      <p className="mt-2 text-sm text-ink-muted">
        {formatMeetAt(post.meetAt)} {ja.companion.meetSuffix}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-primary">
          {ja.companion.members(post.memberCount, post.capacity)}
        </span>
        {post.isMine && (
          <span className="rounded-md border border-primary px-2 py-0.5 text-xs text-primary">
            {ja.companion.mine}
          </span>
        )}
        {post.myRequestStatus && (
          <span className="rounded-md bg-ink px-2 py-0.5 text-xs text-surface">
            {ja.companion.requestStatus[post.myRequestStatus]}
          </span>
        )}
      </div>
    </Link>
  )
}
