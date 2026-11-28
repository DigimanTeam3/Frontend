import { useCallback, useRef, useState } from 'react'
import { type ChatEntry, useConciergeChat } from '@/features/concierge/hooks/useConciergeChat'
import { useSpeech } from '@/features/concierge/hooks/useSpeech'
import { useVoiceRecorder } from '@/features/concierge/hooks/useVoiceRecorder'
import { validRecommendations } from '@/features/concierge/lib/reply'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge

/** Which counter is on screen. Both use the same conversation. */
export type ConciergeView = 'voice' | 'chat'

/**
 * Everything S16 keeps while the page is open: the conversation, the microphone and the voice
 * that reads replies. The voice counter (default) and the chat counter both run on this, so
 * switching between them keeps the conversation going.
 */
export function useConciergeSession() {
  const chat = useConciergeChat()
  const speech = useSpeech()
  const [view, setViewState] = useState<ConciergeView>('voice')
  const [draft, setDraft] = useState('')
  const viewRef = useRef(view)

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
  }
}

export type ConciergeSession = ReturnType<typeof useConciergeSession>
