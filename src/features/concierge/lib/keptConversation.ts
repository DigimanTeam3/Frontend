import type { ChatEntry } from '@/features/concierge/hooks/useConciergeChat'

// The conversation is kept for this tab only, so 「詳細を見る」 → back shows the same tickets.
// Closing the counter (✕) clears it.
const ENTRIES_KEY = 'digiman.concierge.conversation'
const VIEW_KEY = 'digiman.concierge.view'
// Plenty for one visit; keeps the stored text small.
const MAX_ENTRIES = 40

type KeptEntry = Extract<ChatEntry, { role: 'user' | 'assistant' }>

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function isKeptEntry(value: unknown): value is KeptEntry {
  if (!isObject(value) || typeof value.id !== 'string') return false
  if (value.role === 'user') return typeof value.text === 'string'
  if (value.role !== 'assistant' || !isObject(value.reply)) return false
  const { reply } = value
  return (
    typeof reply.reply === 'string' &&
    typeof reply.kind === 'string' &&
    Array.isArray(reply.recommendations) &&
    Array.isArray(reply.suggestions) &&
    isObject(reply.conditions)
  )
}

/** Keeps questions and answers (error slips are not worth showing again). */
export function keepConversation(entries: ChatEntry[]) {
  try {
    const kept = entries.filter((entry) => entry.role !== 'error').slice(-MAX_ENTRIES)
    if (kept.length === 0) sessionStorage.removeItem(ENTRIES_KEY)
    else sessionStorage.setItem(ENTRIES_KEY, JSON.stringify(kept))
  } catch {
    // Storage blocked (private mode): the conversation just starts over next time.
  }
}

/** The kept conversation, ending with an answer (a question left unanswered is dropped). */
export function peekConversation(): ChatEntry[] {
  try {
    const raw = sessionStorage.getItem(ENTRIES_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    if (!Array.isArray(value) || !value.every(isKeptEntry)) return []
    const entries = value as KeptEntry[]
    const last = entries.findLastIndex((entry) => entry.role === 'assistant')
    return entries.slice(0, last + 1)
  } catch {
    return []
  }
}

export function keepView(view: 'voice' | 'chat') {
  try {
    sessionStorage.setItem(VIEW_KEY, view)
  } catch {
    // Opens on the voice counter next time.
  }
}

export function peekView(): 'voice' | 'chat' {
  try {
    return sessionStorage.getItem(VIEW_KEY) === 'chat' ? 'chat' : 'voice'
  } catch {
    return 'voice'
  }
}

export function clearConversation() {
  try {
    sessionStorage.removeItem(ENTRIES_KEY)
    sessionStorage.removeItem(VIEW_KEY)
  } catch {
    // Nothing to clear.
  }
}
