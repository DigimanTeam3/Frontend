import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ConciergeError,
  sendConciergeMessage,
  toConciergeError,
  transcribeAudio,
} from '@/features/concierge/api'
import type {
  ConciergeConditions,
  ConciergeHistoryItem,
  ConciergeReply,
} from '@/shared/types/concierge'

export const MAX_QUESTION_LENGTH = 200
const MAX_HISTORY = 10
const MAX_HISTORY_TEXT = 1000

export type ChatEntry =
  | { id: string; role: 'user'; text: string; via: 'text' | 'voice'; number: number }
  | { id: string; role: 'assistant'; reply: ConciergeReply; via: 'text' | 'voice' }
  | { id: string; role: 'error'; error: ConciergeError; retryText: string | null }

/** What the counter clerk is doing. Matches the state table in the API proposal (#26). */
export type ClerkMood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'clarify' | 'notFound'

let nextId = 0
const newId = () => `c${++nextId}`

function toHistory(entries: ChatEntry[]): ConciergeHistoryItem[] {
  const items: ConciergeHistoryItem[] = []
  entries.forEach((entry, i) => {
    // Only questions that got an answer; a failed one would leave two user turns in a row.
    if (entry.role === 'user' && entries[i + 1]?.role === 'assistant') {
      items.push({ role: 'user', text: entry.text })
    }
    if (entry.role === 'assistant') items.push({ role: 'assistant', text: entry.reply.reply })
  })
  return items
    .slice(-MAX_HISTORY)
    .map((item) => ({ ...item, text: item.text.slice(0, MAX_HISTORY_TEXT) }))
}

/**
 * Conversation state for S16. Keeps the last reply's conditions and sends them back with the
 * next question, so 「土曜日だけ」 narrows the previous search. Nothing is stored after leaving.
 */
export function useConciergeChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [pending, setPending] = useState<'transcribe' | 'messages' | null>(null)
  const entriesRef = useRef(entries)
  const conditionsRef = useRef<ConciergeConditions | null>(null)
  const mountedRef = useRef(true)
  const busyRef = useRef(false)

  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const update = useCallback((next: ChatEntry[]) => {
    entriesRef.current = next
    setEntries(next)
  }, [])

  const ask = useCallback(
    async (text: string, via: 'text' | 'voice', addQuestion: boolean) => {
      // History is everything before this question (the question goes in `text`).
      const before = entriesRef.current.filter((entry) => entry.role !== 'error')
      const history = toHistory(addQuestion ? before : before.slice(0, -1))
      if (addQuestion) {
        const number = before.filter((entry) => entry.role === 'user').length + 1
        update([...before, { id: newId(), role: 'user', text, via, number }])
      } else {
        update(before)
      }

      setPending('messages')
      try {
        const reply = await sendConciergeMessage({
          text,
          history,
          conditions: conditionsRef.current,
        })
        if (!mountedRef.current) return null
        conditionsRef.current = reply.conditions
        const entry: ChatEntry = { id: newId(), role: 'assistant', reply, via }
        update([...entriesRef.current, entry])
        return entry
      } catch (error) {
        if (!mountedRef.current) return null
        const conciergeError = toConciergeError(error, 'messages')
        const entry: ChatEntry = {
          id: newId(),
          role: 'error',
          error: conciergeError,
          retryText: text,
        }
        // A rejected question goes back to the text box (the page does that), so drop its slip.
        // Also on a retry: the slip of the retried question is the last entry.
        const kept =
          conciergeError.kind === 'invalid' && entriesRef.current.at(-1)?.role === 'user'
            ? entriesRef.current.slice(0, -1)
            : entriesRef.current
        update([...kept, entry])
        return entry
      } finally {
        if (mountedRef.current) setPending(null)
      }
    },
    [update],
  )

  const run = useCallback(async <T>(task: () => Promise<T>) => {
    if (busyRef.current) return null
    busyRef.current = true
    try {
      return await task()
    } finally {
      busyRef.current = false
    }
  }, [])

  /** Sends a typed question or a tapped chip. Returns the reply or error entry (null if skipped). */
  const send = useCallback(
    (raw: string, via: 'text' | 'voice' = 'text') => {
      const text = raw.trim().slice(0, MAX_QUESTION_LENGTH)
      if (!text) return Promise.resolve(null)
      return run(() => ask(text, via, true))
    },
    [ask, run],
  )

  /** Sends the question of the last failed request again (no second request slip). */
  const retry = useCallback(() => {
    const last = entriesRef.current.at(-1)
    if (last?.role !== 'error' || !last.retryText) return Promise.resolve(null)
    const text = last.retryText
    return run(() => ask(text, 'text', false))
  }, [ask, run])

  /** Voice: audio → text (shown as a request slip) → reply. */
  const sendVoice = useCallback(
    (audio: Blob) =>
      run(async () => {
        setPending('transcribe')
        let text: string
        try {
          text = (await transcribeAudio(audio)).text.trim()
        } catch (error) {
          if (!mountedRef.current) return null
          setPending(null)
          const withoutError = entriesRef.current.filter((entry) => entry.role !== 'error')
          update([
            ...withoutError,
            {
              id: newId(),
              role: 'error',
              error: toConciergeError(error, 'transcribe'),
              retryText: null,
            },
          ])
          return null
        }
        if (!mountedRef.current) return null
        if (!text) {
          setPending(null)
          update([
            ...entriesRef.current.filter((entry) => entry.role !== 'error'),
            {
              id: newId(),
              role: 'error',
              error: { kind: 'notRecognized', retryAfter: null },
              retryText: null,
            },
          ])
          return null
        }
        return ask(text.slice(0, MAX_QUESTION_LENGTH), 'voice', true)
      }),
    [ask, run, update],
  )

  const lastReply = [...entries].reverse().find((entry) => entry.role !== 'user')
  const mood: ClerkMood = pending
    ? 'thinking'
    : lastReply?.role === 'assistant'
      ? lastReply.reply.kind === 'answer'
        ? 'speaking'
        : lastReply.reply.kind
      : 'idle'

  return { entries, pending, mood, send, retry, sendVoice }
}
