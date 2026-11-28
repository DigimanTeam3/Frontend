import { useCallback, useEffect, useState } from 'react'
import { getMessages, sendMessage } from '@/features/companion/talkApi'
import { apiErrorCode, isApiError } from '@/shared/api/errors'
import type { CompanionMessage } from '@/shared/types/companionChat'

/** New messages are asked for this often while the screen is visible. */
export const CHAT_POLL_MS = 4000
/** Pages read in one go (100 each), so a long history cannot keep one poll running. */
const MAX_PAGES_PER_POLL = 10

export type ChatClosedReason = 'notMember' | 'notOpen' | 'notFound' | 'network'

export type ChatRoomStatus =
  { kind: 'loading' } | { kind: 'ready' } | { kind: 'closed'; reason: ChatClosedReason }

/** A message of mine that the server has not saved yet. */
export interface PendingMessage {
  localId: string
  content: string
  createdAt: string
  status: 'sending' | 'failed'
}

/** Reason the chat cannot be used, or null for errors that may pass (server, network). */
function closedReason(error: unknown): Exclude<ChatClosedReason, 'network'> | null {
  switch (apiErrorCode(error)) {
    case 'CHAT_NOT_MEMBER':
      return 'notMember'
    case 'CHAT_NOT_OPEN':
      return 'notOpen'
    case 'COMPANION_NOT_FOUND':
      return 'notFound'
    default:
      return null
  }
}

/** Adds messages by id (a poll can bring back one we already have) and keeps them oldest first. */
function mergeMessages(current: CompanionMessage[], incoming: CompanionMessage[]) {
  if (incoming.length === 0) return current
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

let localIdSeed = 0

/**
 * Messages of one group chat. Polls `afterId` every few seconds while the page is visible,
 * stops while it is hidden and asks once as soon as it is shown again.
 * Sending adds the message at once and marks it failed if the server does not take it.
 * Give the screen `key={postId}` so another post starts with an empty room.
 */
export function useChatRoom(postId: number) {
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [pending, setPending] = useState<PendingMessage[]>([])
  const validId = Number.isSafeInteger(postId) && postId > 0
  // A broken address (/companions/abc/chat) asks nothing and shows "not found".
  const [status, setStatus] = useState<ChatRoomStatus>(
    validId ? { kind: 'loading' } : { kind: 'closed', reason: 'notFound' },
  )
  /** A poll failed after the first load; the next one tries again by itself. */
  const [unstable, setUnstable] = useState(false)
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    if (!validId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let loaded = false
    let waitingForVisible = false
    // Only ids from GET move this forward: a sent message's id may be above messages from
    // other people that this screen has not received yet.
    let lastId = 0

    /** true when polling must stop (the chat is closed to me, or the login ended). */
    const poll = async (): Promise<boolean> => {
      if (inFlight) return false
      inFlight = true
      try {
        for (let page = 0; page < MAX_PAGES_PER_POLL; page++) {
          const response = await getMessages(postId, lastId)
          if (cancelled) return true
          const last = response.items.at(-1)
          if (last) {
            lastId = Math.max(lastId, last.id)
            setMessages((current) => mergeMessages(current, response.items))
          }
          if (!response.hasMore || !last) break
        }
        loaded = true
        setStatus({ kind: 'ready' })
        setUnstable(false)
        return false
      } catch (error) {
        if (cancelled) return true
        const reason = closedReason(error)
        if (reason) {
          setStatus({ kind: 'closed', reason })
          return true
        }
        // The login is over: apiClient logs out and RequireAuth leaves this screen.
        if (isApiError(error, 401)) return true
        if (!loaded) {
          setStatus({ kind: 'closed', reason: 'network' })
          return true
        }
        setUnstable(true)
        return false
      } finally {
        inFlight = false
      }
    }

    const tick = async () => {
      if (document.visibilityState !== 'visible') {
        waitingForVisible = true
        return
      }
      const stop = await poll()
      if (!cancelled && !stop) timer = setTimeout(tick, CHAT_POLL_MS)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && waitingForVisible) {
        waitingForVisible = false
        clearTimeout(timer)
        void tick()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    void tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [postId, validId, loadKey])

  const deliver = useCallback(
    (localId: string, content: string) => {
      sendMessage(postId, content).then(
        (message) => {
          setMessages((current) => mergeMessages(current, [message]))
          setPending((current) => current.filter((item) => item.localId !== localId))
        },
        (error: unknown) => {
          setPending((current) =>
            current.map((item) =>
              item.localId === localId ? { ...item, status: 'failed' } : item,
            ),
          )
          const reason = closedReason(error)
          if (reason) setStatus({ kind: 'closed', reason })
        },
      )
    },
    [postId],
  )

  const send = useCallback(
    (text: string) => {
      const content = text.trim()
      // The composer is shown only while the chat is ready.
      if (!content) return
      localIdSeed += 1
      const localId = `local-${localIdSeed}`
      setPending((current) => [
        ...current,
        { localId, content, createdAt: new Date().toISOString(), status: 'sending' },
      ])
      deliver(localId, content)
    },
    [deliver],
  )

  const resend = useCallback(
    (localId: string) => {
      const item = pending.find((message) => message.localId === localId)
      if (!item || item.status !== 'failed') return
      setPending((current) =>
        current.map((message) =>
          message.localId === localId ? { ...message, status: 'sending' } : message,
        ),
      )
      deliver(localId, item.content)
    },
    [pending, deliver],
  )

  const discard = useCallback((localId: string) => {
    setPending((current) => current.filter((message) => message.localId !== localId))
  }, [])

  // Starts over from the first message (the retry button after a failed first load).
  const reload = useCallback(() => {
    setMessages([])
    setStatus({ kind: 'loading' })
    setUnstable(false)
    setLoadKey((key) => key + 1)
  }, [])

  return { status, messages, pending, unstable, send, resend, discard, reload }
}
