import { useId, useState, type FormEvent } from 'react'
import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import {
  COMMENT_MAX_LENGTH,
  textLength,
  useCommentMutations,
  useCommentsQuery,
} from '@/features/companion/talkApi'
import { apiErrorCode } from '@/shared/api/errors'
import { formatCount, formatDateTime } from '@/shared/i18n/format'
import { ja } from '@/shared/i18n/ja'
import type { CompanionComment } from '@/shared/types/companionChat'
import { Button } from '@/shared/ui/Button'
import { State } from '@/shared/ui/State'
import { Toast } from '@/shared/ui/Toast'

const text = ja.companionComments

/** Screen copy for a failed write or delete: the code's message, offline, or the shared error. */
function errorText(error: unknown) {
  const code = apiErrorCode(error)
  if (code && text.errors[code]) return text.errors[code]
  return error instanceof TypeError ? ja.common.offline : ja.common.error
}

// S08 comments: anyone on the post can read and write; the writer can delete their own.
// The post screen is behind login, so no login prompt is needed here.
export function CommentSection({ postId }: { postId: number }) {
  const titleId = useId()
  const comments = useCommentsQuery(postId)
  const { create, remove } = useCommentMutations(postId)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const items = comments.data?.pages.flatMap((page) => page.items) ?? []
  const total = comments.data?.pages.at(-1)?.total ?? 0

  const onDelete = (commentId: number) => {
    setDeleteError(null)
    remove.mutate(commentId, {
      onSuccess: () => {
        setConfirmingId(null)
        setToast(text.deleted)
      },
      onError: (error) => {
        setConfirmingId(null)
        setDeleteError(errorText(error))
      },
    })
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className="flex items-baseline gap-2 font-bold">
        {text.title}
        {total > 0 && (
          <span className="text-sm font-normal text-ink-muted">{formatCount(total)}</span>
        )}
      </h2>

      {comments.isPending ? (
        <p role="status" className="py-4 text-sm text-ink-muted">
          {ja.common.loading}
        </p>
      ) : comments.isError && items.length === 0 ? (
        <State
          kind="error"
          title={text.loadError}
          onRetry={() => void comments.refetch()}
          className="py-4"
        />
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-surface-2 px-4 py-5 text-center">
          <p className="text-sm font-bold">{text.empty}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{text.emptyHint}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              confirming={confirmingId === comment.id}
              deleting={remove.isPending && remove.variables === comment.id}
              onAskDelete={() => {
                setDeleteError(null)
                setConfirmingId(comment.id)
              }}
              onKeep={() => setConfirmingId(null)}
              onDelete={() => onDelete(comment.id)}
            />
          ))}
        </ul>
      )}

      {deleteError && (
        <p role="alert" className="text-sm text-danger">
          {deleteError}
        </p>
      )}

      {comments.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          fullWidth
          disabled={comments.isFetchingNextPage}
          onClick={() => void comments.fetchNextPage()}
        >
          {comments.isFetchingNextPage ? text.loadingMore : text.more}
        </Button>
      )}

      <CommentComposer
        busy={create.isPending}
        error={create.isError ? errorText(create.error) : null}
        onSubmit={(content, done) => create.mutate(content, { onSuccess: done })}
        onEdit={() => create.isError && create.reset()}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  )
}

interface CommentItemProps {
  comment: CompanionComment
  confirming: boolean
  deleting: boolean
  onAskDelete: () => void
  onKeep: () => void
  onDelete: () => void
}

function CommentItem({
  comment,
  confirming,
  deleting,
  onAskDelete,
  onKeep,
  onDelete,
}: CommentItemProps) {
  return (
    <li className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <InitialAvatar name={comment.author.nickname} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{comment.author.nickname}</p>
        {comment.isMine && (
          <span className="shrink-0 rounded-md border border-gate px-1.5 py-0.5 text-[11px] text-gate-ink">
            {text.mine}
          </span>
        )}
        <time dateTime={comment.createdAt} className="shrink-0 text-[11px] text-ink-muted">
          {formatDateTime(comment.createdAt)}
        </time>
      </div>
      {/* Plain text only: React escapes it, and line breaks are kept by whitespace-pre-wrap. */}
      <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {comment.content}
      </p>

      {comment.isMine &&
        (confirming ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-2 p-2">
            <p className="min-w-0 flex-1 text-xs">{text.confirmDelete}</p>
            <button
              type="button"
              onClick={onKeep}
              disabled={deleting}
              className="rounded-lg px-3 py-2 text-xs text-ink-muted disabled:opacity-40"
            >
              {text.keep}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-lg bg-danger px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              {deleting ? text.deleting : text.confirm}
            </button>
          </div>
        ) : (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={onAskDelete}
              aria-label={text.deleteLabel(comment.author.nickname)}
              className="rounded-lg px-2 py-1.5 text-xs text-ink-muted active:bg-ink/5"
            >
              {text.delete}
            </button>
          </div>
        ))}
    </li>
  )
}

interface CommentComposerProps {
  busy: boolean
  error: string | null
  /** `done` clears the input after the comment is saved. */
  onSubmit: (content: string, done: () => void) => void
  onEdit: () => void
}

function CommentComposer({ busy, error, onSubmit, onEdit }: CommentComposerProps) {
  const inputId = useId()
  const counterId = useId()
  const [value, setValue] = useState('')
  const length = textLength(value)
  const tooLong = length > COMMENT_MAX_LENGTH
  const canSend = length > 0 && !tooLong && !busy

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    onSubmit(value, () => setValue(''))
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl bg-surface p-3">
      <label htmlFor={inputId} className="sr-only">
        {text.inputLabel}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          onEdit()
        }}
        rows={2}
        placeholder={text.placeholder}
        aria-describedby={counterId}
        aria-invalid={tooLong || undefined}
        className="w-full resize-none rounded-lg bg-surface-2 px-3 py-2.5 text-sm leading-relaxed placeholder:text-ink-faint focus:ring-2 focus:ring-gate focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <p
          id={counterId}
          className={`min-w-0 flex-1 text-xs ${tooLong ? 'text-danger' : 'text-ink-muted'}`}
        >
          {tooLong ? text.tooLong(COMMENT_MAX_LENGTH) : text.length(length, COMMENT_MAX_LENGTH)}
        </p>
        <Button type="submit" size="sm" disabled={!canSend}>
          {busy ? text.sending : text.send}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
