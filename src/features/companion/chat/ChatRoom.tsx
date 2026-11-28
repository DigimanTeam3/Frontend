import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCompanionQuery } from '@/features/companion/api'
import { ChatComposer } from '@/features/companion/chat/ChatComposer'
import { ChatMessageList } from '@/features/companion/chat/ChatMessageList'
import { useChatRoom, type ChatClosedReason } from '@/features/companion/chat/useChatRoom'
import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import { formatPeople } from '@/shared/i18n/format'
import { ja } from '@/shared/i18n/ja'
import { LockIcon } from '@/shared/ui/icons/LockIcon'
import { PeopleIcon } from '@/shared/ui/icons/PeopleIcon'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

const text = ja.companionChat
/** Closer than this to the bottom counts as "reading the latest", so new messages scroll in. */
const NEAR_BOTTOM_PX = 120

function isNearBottom() {
  const page = document.documentElement
  return window.innerHeight + window.scrollY >= page.scrollHeight - NEAR_BOTTOM_PX
}

function scrollToBottom(behavior: ScrollBehavior) {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
}

// Group chat of a companion post: the author and accepted members (S08).
export function ChatRoom({ postId }: { postId: number }) {
  const room = useChatRoom(postId)
  const { data: post } = useCompanionQuery(postId)
  const composerRef = useRef<HTMLFormElement>(null)
  const [composerHeight, setComposerHeight] = useState(72)
  const [showNewButton, setShowNewButton] = useState(false)
  const nearBottomRef = useRef(true)
  const seenRef = useRef({ messages: 0, pending: 0 })

  // Keep the last message above the fixed input bar, whatever its height.
  useEffect(() => {
    const composer = composerRef.current
    if (!composer) return
    const observer = new ResizeObserver(() => setComposerHeight(composer.offsetHeight))
    observer.observe(composer)
    return () => observer.disconnect()
  }, [room.status.kind])

  useEffect(() => {
    const onScroll = () => {
      nearBottomRef.current = isNearBottom()
      if (nearBottomRef.current) setShowNewButton(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // New messages: follow them when the reader is at the bottom or just sent one; otherwise
  // leave the scroll where it is and offer a button.
  useLayoutEffect(() => {
    const seen = seenRef.current
    const messageCount = room.messages.length
    const pendingCount = room.pending.length
    seenRef.current = { messages: messageCount, pending: pendingCount }
    if (messageCount === seen.messages && pendingCount <= seen.pending) return
    if (seen.messages === 0 && seen.pending === 0) {
      scrollToBottom('instant')
    } else if (pendingCount > seen.pending || nearBottomRef.current) {
      scrollToBottom('smooth')
    } else {
      setShowNewButton(true)
    }
  }, [room.messages.length, room.pending.length])

  if (room.status.kind === 'closed') {
    return <ClosedState reason={room.status.reason} postId={postId} onRetry={room.reload} />
  }

  const others = post?.members.filter((member) => !member.isMe) ?? []

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line pb-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{text.title}</h1>
          {post && <p className="mt-0.5 truncate text-xs text-ink-muted">{post.intro}</p>}
        </div>
        {post && (
          <div className="flex shrink-0 items-center gap-2">
            <span aria-hidden className="flex -space-x-2">
              {others.slice(0, 3).map((member) => (
                <span key={member.user.id} className="rounded-full ring-2 ring-app">
                  <InitialAvatar name={member.user.nickname} size="sm" />
                </span>
              ))}
            </span>
            <span className="text-xs text-ink-muted">
              {text.memberCount(formatPeople(post.memberCount))}
            </span>
          </div>
        )}
      </header>

      {room.unstable && (
        <p
          role="status"
          className="sticky top-[calc(env(safe-area-inset-top)+52px)] z-[5] mt-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn"
        >
          {text.reconnecting}
        </p>
      )}

      <p className="mx-auto mt-3 max-w-[300px] text-center text-[11px] leading-relaxed text-ink-muted">
        {text.intro}
      </p>

      <div className="mt-2 flex-1">
        {room.status.kind === 'loading' ? (
          <p role="status" className="py-8 text-center text-sm text-ink-muted">
            {ja.common.loading}
          </p>
        ) : room.messages.length === 0 && room.pending.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-bold">{text.empty}</p>
            <p className="mt-1 text-xs text-ink-muted">{text.emptyHint}</p>
          </div>
        ) : (
          <ChatMessageList
            messages={room.messages}
            pending={room.pending}
            onResend={room.resend}
            onDiscard={room.discard}
          />
        )}
      </div>

      {/* Room for the fixed input bar under the last message. */}
      <div aria-hidden style={{ height: composerHeight }} />

      {showNewButton && (
        <button
          type="button"
          onClick={() => {
            setShowNewButton(false)
            scrollToBottom('smooth')
          }}
          style={{ bottom: composerHeight + 12 }}
          className="fixed left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-float"
        >
          {text.newMessages}
        </button>
      )}

      {room.status.kind === 'ready' && <ChatComposer ref={composerRef} onSend={room.send} />}
    </section>
  )
}

function ClosedState({
  reason,
  postId,
  onRetry,
}: {
  reason: ChatClosedReason
  postId: number
  onRetry: () => void
}) {
  const back = { label: text.backToPost, to: `/companions/${postId}` }
  switch (reason) {
    case 'network':
      return <State kind="error" onRetry={onRetry} className="my-auto" />
    case 'notFound':
      return (
        <State
          kind="error"
          title={text.notFound}
          icon={<SearchIcon />}
          action={{ label: ja.notFound.backHome, to: '/' }}
          className="my-auto"
        />
      )
    case 'notMember':
      return (
        <State
          kind="error"
          title={text.notMember.title}
          body={text.notMember.body}
          icon={<LockIcon className="size-[30px]" />}
          action={back}
          className="my-auto"
        />
      )
    case 'notOpen':
      return (
        <State
          kind="empty"
          title={text.notOpen.title}
          body={text.notOpen.body}
          icon={<PeopleIcon className="size-[30px]" />}
          action={back}
          className="my-auto"
        />
      )
  }
}
