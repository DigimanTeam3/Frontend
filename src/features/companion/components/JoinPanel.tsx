import { ja } from '@/shared/i18n/ja'
import type { CompanionPostDetail } from '@/shared/types/companion'

const text = ja.companionDetail

export interface JoinPanelProps {
  post: CompanionPostDetail
  busy: boolean
  onRequest: () => void
  onCancel: () => void
}

/** Viewer of someone else's post: request to join, wait, then see the match. */
export function JoinPanel({ post, busy, onRequest, onCancel }: JoinPanelProps) {
  const requestStatus = post.myRequest?.status

  if (requestStatus === 'ACCEPTED') {
    return <Note tone="primary">{text.acceptedNote}</Note>
  }
  if (requestStatus === 'REJECTED') {
    return <Note>{text.rejectedNote}</Note>
  }
  if (requestStatus === 'PENDING') {
    return (
      <div className="flex flex-col gap-3">
        <Note>{text.pendingNote}</Note>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-2xl border border-line py-3.5 font-bold disabled:opacity-50"
        >
          {text.cancel}
        </button>
      </div>
    )
  }
  if (post.status !== 'OPEN') {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-2xl bg-ink/10 py-4 font-bold text-ink-muted"
      >
        {post.status === 'FULL' ? text.fullNote : text.closedNote}
      </button>
    )
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onRequest}
      className="w-full rounded-2xl bg-primary py-4 font-bold text-surface disabled:opacity-60"
    >
      {busy ? text.joining : text.join}
    </button>
  )
}

function Note({ children, tone }: { children: string; tone?: 'primary' }) {
  return (
    <p
      role="status"
      className={`rounded-xl p-4 text-sm ${tone === 'primary' ? 'bg-primary/10 font-bold text-primary' : 'bg-ink/5'}`}
    >
      {children}
    </p>
  )
}
