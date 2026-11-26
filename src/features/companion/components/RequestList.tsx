import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import { ja } from '@/shared/i18n/ja'
import type { CompanionPostDetail } from '@/shared/types/companion'

const text = ja.companionDetail

export interface RequestListProps {
  post: CompanionPostDetail
  busy: boolean
  onAccept: (requestId: number) => void
  onReject: (requestId: number) => void
}

/** Author view: people who asked to join, with accept / decline. */
export function RequestList({ post, busy, onAccept, onReject }: RequestListProps) {
  const isOpen = post.status === 'OPEN'
  return (
    <section>
      <h2 className="font-bold">
        {text.requestsTitle} {post.requests.length > 0 && post.requests.length}
      </h2>
      <p className="mt-1 text-xs text-ink-muted">{text.ownerNote}</p>
      {post.requests.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{text.requestsEmpty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {post.requests.map((request) => (
            <li
              key={request.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
            >
              <InitialAvatar name={request.user.nickname} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold">{request.user.nickname}</span>
              {request.status === 'REJECTED' ? (
                <span className="text-xs text-ink-muted">{text.requestRejected}</span>
              ) : !isOpen ? (
                <span className="text-xs text-ink-muted">{ja.companion.status[post.status]}</span>
              ) : (
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReject(request.id)}
                    className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-50"
                  >
                    {text.reject}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAccept(request.id)}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-surface disabled:opacity-50"
                  >
                    {text.accept}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
