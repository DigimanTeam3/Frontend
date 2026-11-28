import { useParams } from 'react-router'
import { useCompanionActionMutation, useCompanionQuery } from '@/features/companion/api'
import { EventStrip } from '@/features/companion/components/EventStrip'
import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import { JoinPanel } from '@/features/companion/components/JoinPanel'
import { KippuTicket } from '@/features/companion/components/KippuTicket'
import { RequestList } from '@/features/companion/components/RequestList'
import { StatusTag } from '@/features/companion/components/StatusTag'
import { apiErrorCode } from '@/shared/api/errors'
import { ja } from '@/shared/i18n/ja'

const text = ja.companionDetail

// S08. Companion post: ask to join → the author accepts → names are printed on the ticket seats.
export function CompanionDetailPage() {
  const postId = Number(useParams().postId)
  const action = useCompanionActionMutation(postId)
  // No polling while an action is on its way, so an older answer cannot replace the new one.
  const {
    data: post,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCompanionQuery(postId, { paused: action.isPending })

  // A 401 needs nothing here: apiClient logs out and clears the cache, and RequireAuth sends
  // the user to login with this page as the redirect.

  const validPostId = Number.isInteger(postId) && postId > 0
  const notFound = !validPostId || apiErrorCode(error) === 'COMPANION_NOT_FOUND'
  const actionErrorCode = apiErrorCode(action.error)
  const actionError = action.isError
    ? ((actionErrorCode && text.errors[actionErrorCode]) ?? ja.common.error)
    : null

  return (
    <section>
      {/* Back is in the shared top bar (RootLayout). */}
      <h1 className="mb-4 text-xl font-bold">{text.title}</h1>

      {notFound ? (
        <p className="py-12 text-center text-ink-muted">{text.notFound}</p>
      ) : isPending ? (
        <p className="text-ink-muted">{ja.common.loading}</p>
      ) : isError && !post ? (
        <div className="py-8 text-center">
          <p className="text-danger">{ja.common.error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-sm"
          >
            {ja.companion.retry}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <InitialAvatar name={post.author.nickname} />
            <p className="min-w-0 flex-1 truncate font-bold">{post.author.nickname}</p>
            {post.isMine && (
              <span className="rounded-md border border-gate px-2 py-0.5 text-xs text-gate-ink">
                {ja.companion.mine}
              </span>
            )}
            <StatusTag status={post.status} />
          </div>

          <p className="text-lg font-bold break-words">{post.intro}</p>

          <KippuTicket post={post} />

          {post.isMine ? (
            <RequestList
              post={post}
              busy={action.isPending}
              onAccept={(requestId) => action.mutate({ type: 'accept', requestId })}
              onReject={(requestId) => action.mutate({ type: 'reject', requestId })}
            />
          ) : (
            <JoinPanel
              post={post}
              busy={action.isPending}
              onRequest={() => action.mutate({ type: 'request' })}
              onCancel={() => action.mutate({ type: 'cancel' })}
            />
          )}

          {actionError && (
            <p role="alert" className="text-center text-sm text-danger">
              {actionError}
            </p>
          )}

          <EventStrip event={post.event} label={text.eventLabel} />
        </div>
      )}
    </section>
  )
}
