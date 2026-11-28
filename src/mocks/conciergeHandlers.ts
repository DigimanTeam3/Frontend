import { delay, http, HttpResponse } from 'msw'
import { MOCK_TRANSCRIPT, mockConciergeReply } from '@/mocks/data/concierge'
import type { ConciergeMessageRequest } from '@/shared/types/concierge'

const errorBody = (code: string, message: string) => ({ code, message })

const MAX_TEXT = 200
const MAX_HISTORY = 10
const MAX_AUDIO_BYTES = 1024 * 1024

// Mock-only words for checking the error screens from the text box:
// 「エラー」 500, 「混雑」 429 (Retry-After 30), 「休業」 503, 「圏外」 network error.
export const conciergeHandlers = [
  http.post('/api/concierge/messages', async ({ request }) => {
    const body = (await request.json()) as ConciergeMessageRequest
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text || text.length > MAX_TEXT || (body.history ?? []).length > MAX_HISTORY) {
      return HttpResponse.json(errorBody('INVALID_MESSAGE', 'Invalid message'), { status: 400 })
    }

    // Long enough to see the "thinking" counter.
    await delay(1200)
    if (text.includes('圏外')) return HttpResponse.error()
    if (text.includes('エラー')) {
      return HttpResponse.json(errorBody('INTERNAL_ERROR', 'Mock server error'), { status: 500 })
    }
    if (text.includes('混雑')) {
      return HttpResponse.json(errorBody('RATE_LIMITED', 'Too many requests'), {
        status: 429,
        headers: { 'Retry-After': '30' },
      })
    }
    if (text.includes('休業')) {
      return HttpResponse.json(errorBody('CONCIERGE_UNAVAILABLE', 'Concierge is closed'), {
        status: 503,
      })
    }
    return HttpResponse.json(mockConciergeReply({ ...body, text }))
  }),

  http.post('/api/concierge/transcribe', async ({ request }) => {
    const form = await request.formData()
    const audio = form.get('audio')
    if (!(audio instanceof Blob) || !audio.type.startsWith('audio/')) {
      return HttpResponse.json(errorBody('INVALID_AUDIO', 'Audio is required'), { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return HttpResponse.json(errorBody('AUDIO_TOO_LARGE', 'Audio is too large'), {
        status: 413,
      })
    }
    await delay(700)
    if (audio.size === 0) {
      return HttpResponse.json(errorBody('SPEECH_NOT_RECOGNIZED', 'No speech'), { status: 422 })
    }
    return HttpResponse.json({ text: MOCK_TRANSCRIPT })
  }),
]
