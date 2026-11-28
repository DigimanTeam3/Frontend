import { ApiError, apiClient } from '@/shared/api/client'
import type {
  ConciergeMessageRequest,
  ConciergeReply,
  ConciergeTranscription,
} from '@/shared/types/concierge'

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
