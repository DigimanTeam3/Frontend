import { ApiError, apiClient } from '@/shared/api/client'
import type {
  ConciergeMessageRequest,
  ConciergeReply,
  ConciergeTranscription,
} from '@/shared/types/concierge'
import type { Ticket, TicketCreateRequest } from '@/shared/types/ticket'

export function sendConciergeMessage(body: ConciergeMessageRequest) {
  return apiClient<ConciergeReply>('/concierge/messages', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function transcribeAudio(audio: Blob) {
  const form = new FormData()
  const extension = audio.type.includes('mp4') ? 'mp4' : 'webm'
  form.append('audio', audio, `question.${extension}`)
  return apiClient<ConciergeTranscription>('/concierge/transcribe', { method: 'POST', body: form })
}

/** Longest text the speech endpoint accepts (400 above it). */
export const SPEECH_MAX_LENGTH = 600

/**
 * The text read aloud by the server voice, as audio (mp3). No login needed.
 * Its own fetch because `apiClient` parses JSON; same base URL rule as `apiClient`.
 */
export async function fetchSpeech(text: string, signal: AbortSignal) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
  const response = await fetch(`${baseUrl}/concierge/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  })
  // Also refuse a 200 that is not audio (e.g. an HTML page when /api is not forwarded).
  if (!response.ok || !response.headers.get('Content-Type')?.startsWith('audio/')) {
    throw new ApiError(response.status, await response.text())
  }
  return response.blob()
}

/** Keeps the conditions as a 予約券 (S17). Needs login. Answers the new ticket (201). */
export function saveCondition(body: TicketCreateRequest) {
  return apiClient<Ticket>('/saved-conditions', { method: 'POST', body: JSON.stringify(body) })
}

export type ConciergeErrorKind =
  | 'invalid' // 400
  | 'rateLimited' // 429
  | 'unavailable' // 503
  | 'notRecognized' // 422 (speech only)
  | 'audio' // 400 / 413 / 500 on transcribe
  | 'failed' // 500, network error, anything else

export interface ConciergeError {
  kind: ConciergeErrorKind
  /** Seconds to wait (429 Retry-After), when the server sends it. */
  retryAfter: number | null
}

function errorCode(error: ApiError) {
  try {
    const body = JSON.parse(error.message) as { code?: unknown }
    return typeof body.code === 'string' ? body.code : null
  } catch {
    return null
  }
}

/** Maps an error from either concierge API to what the screen shows. */
export function toConciergeError(error: unknown, api: 'messages' | 'transcribe'): ConciergeError {
  if (!(error instanceof ApiError)) {
    return { kind: api === 'transcribe' ? 'audio' : 'failed', retryAfter: null }
  }
  const code = errorCode(error)
  if (error.status === 429) return { kind: 'rateLimited', retryAfter: error.retryAfter }
  if (api === 'transcribe') {
    const kind =
      error.status === 422 || code === 'SPEECH_NOT_RECOGNIZED' ? 'notRecognized' : 'audio'
    return { kind, retryAfter: null }
  }
  if (error.status === 400) return { kind: 'invalid', retryAfter: null }
  if (error.status === 503) return { kind: 'unavailable', retryAfter: null }
  return { kind: 'failed', retryAfter: null }
}
