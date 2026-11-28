import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { saveCondition } from '@/features/concierge/api'
import { type ChatEntry, useConciergeChat } from '@/features/concierge/hooks/useConciergeChat'
import { useSpeech } from '@/features/concierge/hooks/useSpeech'
import { useVoiceRecorder } from '@/features/concierge/hooks/useVoiceRecorder'
import {
  keepSavedReservations,
  keepView,
  peekSavedReservations,
  peekView,
} from '@/features/concierge/lib/keptConversation'
import { validRecommendations } from '@/features/concierge/lib/reply'
import { toTicketCreateRequest } from '@/features/concierge/lib/savedCondition'
import { queryKeys } from '@/shared/api/queryKeys'
import { ja } from '@/shared/i18n/ja'
import type { ConciergeConditions } from '@/shared/types/concierge'

const t = ja.concierge

/** Which counter is on screen. Both use the same conversation. */
export type ConciergeView = 'voice' | 'chat'

/** Where the 予約券 offered by one reply stands. */
export type ReservationStatus = 'idle' | 'saving' | 'saved' | 'failed'

/**
 * Everything S16 keeps while the page is open: the conversation, the microphone and the voice
 * that reads replies. The voice counter (default) and the chat counter both run on this, so
 * switching between them keeps the conversation going.
 */
export function useConciergeSession() {
  const chat = useConciergeChat()
  const speech = useSpeech()
  const [view, setViewState] = useState<ConciergeView>(peekView)
  const [draft, setDraft] = useState('')
  const viewRef = useRef(view)
  const queryClient = useQueryClient()

  // 予約券 saved in this conversation, by the id of the reply that offered them. Kept here and not
  // in the card, so switching views neither forgets a saved one nor lets it be saved twice.
  // Kept with the conversation, so coming back from another screen does not offer it again.
  const [savedReservations, setSavedReservations] =
    useState<ReadonlySet<string>>(peekSavedReservations)
  const reservationSave = useMutation({
    mutationFn: ({ conditions }: { id: string; conditions: ConciergeConditions }) =>
      saveCondition(toTicketCreateRequest(conditions, t.voice.reservation.noConditions)),
    onSuccess: (_ticket, { id }) => {
      setSavedReservations((current) => {
        const next = new Set(current).add(id)
        keepSavedReservations(next)
        return next
      })
      return queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })

  const reservationStatus = (id: string): ReservationStatus => {
    if (savedReservations.has(id)) return 'saved'
    if (reservationSave.variables?.id !== id) return 'idle'
    if (reservationSave.isPending) return 'saving'
    return reservationSave.isError ? 'failed' : 'idle'
  }

  const saveReservation = (id: string, conditions: ConciergeConditions) => {
    if (savedReservations.has(id) || reservationSave.isPending) return
    reservationSave.mutate({ id, conditions })
  }

  // The server rejected the question: give it back to the text box so it can be fixed.
  // Text typed while waiting is newer, so it is kept.
  const restoreRejected = (entry: ChatEntry | null) => {
    if (entry?.role !== 'error' || entry.error.kind !== 'invalid') return
    const text = entry.retryText ?? ''
    setDraft((current) => (current.trim() ? current : text))
  }

  // The voice counter reads every reply, then each ticket's reason. The chat counter reads a
  // reply only when the question was asked by voice.
  const speakReply = (entry: ChatEntry | null) => {
    if (entry?.role !== 'assistant') return
    if (viewRef.current === 'voice') {
      const reasons = validRecommendations(entry.reply).map((item) => item.reason)
      speech.speak(entry.id, [entry.reply.reply, ...reasons])
    } else if (entry.via === 'voice') {
      speech.speak(entry.id, entry.reply.reply)
    }
  }

  const recorder = useVoiceRecorder(async (audio) => {
    const entry = await chat.sendVoice(audio)
    speakReply(entry)
    restoreRejected(entry)
  })

  const notice =
    recorder.error === 'denied'
      ? t.errors.micDenied
      : recorder.error === 'unavailable'
        ? t.errors.micUnavailable
        : recorder.error === 'tooShort'
          ? t.errors.notRecognized
          : null

  const sendText = async (text: string) => {
    recorder.clearError()
    speech.cancel()
    // The tap that sent the question lets iPhone Safari read the answer later.
    if (viewRef.current === 'voice') speech.prime()
    const entry = await chat.send(text)
    speakReply(entry)
    restoreRejected(entry)
  }

  const retry = async () => {
    speech.cancel()
    if (viewRef.current === 'voice') speech.prime()
    const entry = await chat.retry()
    speakReply(entry)
    restoreRejected(entry)
  }

  const startRecording = () => {
    recorder.clearError()
    speech.cancel()
    // Also here: a recording that stops by itself (time limit) has no tap of its own.
    speech.prime()
    void recorder.start()
  }

  const stopRecording = () => {
    speech.prime()
    recorder.stop()
  }

  const setView = useCallback(
    (next: ConciergeView) => {
      viewRef.current = next
      speech.cancel()
      setViewState(next)
      keepView(next)
    },
    [speech],
  )

  return {
    chat,
    speech,
    recorder,
    notice,
    draft,
    setDraft,
    view,
    setView,
    sendText,
    retry,
    startRecording,
    stopRecording,
    reservationStatus,
    saveReservation,
  }
}

export type ConciergeSession = ReturnType<typeof useConciergeSession>
