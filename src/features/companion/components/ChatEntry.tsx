import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import type { CompanionPostDetail } from '@/shared/types/companion'
import { buttonClassName } from '@/shared/ui/buttonStyles'

const text = ja.companionChat

/** The chat is open to the author once someone is accepted, and to accepted people. */
function canOpenChat(post: CompanionPostDetail) {
  return (post.isMine && post.memberCount >= 2) || post.myRequest?.status === 'ACCEPTED'
}

/** Way into the group chat after a match. Hidden for everyone who cannot use it yet. */
export function ChatEntry({ post }: { post: CompanionPostDetail }) {
  if (!canOpenChat(post)) return null
  const others = post.members.filter((member) => !member.isMe).map((m) => m.user.nickname)

  return (
    // The author gets the match message here; an accepted person already sees it above.
    <div
      className={`flex flex-col gap-3 ${
        post.isMine ? 'rounded-2xl border-[1.5px] border-gate bg-gate-soft p-4' : ''
      }`}
    >
      {post.isMine && <p className="text-sm font-bold">{text.ownerMatched}</p>}
      {others.length > 0 && (
        <p className="truncate text-xs text-ink-muted">
          {text.entryHint(others.join(text.nameSeparator))}
        </p>
      )}
      <Link to={`/companions/${post.id}/chat`} className={buttonClassName({ fullWidth: true })}>
        {text.open}
      </Link>
    </div>
  )
}
