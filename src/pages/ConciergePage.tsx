import { useEffect, useRef, useState } from 'react'
import { Composer } from '@/features/concierge/components/Composer'
import { CounterReply } from '@/features/concierge/components/CounterReply'
import { CounterWindow } from '@/features/concierge/components/CounterWindow'
import { ErrorSlip, RequestSlip, ThinkingSlip } from '@/features/concierge/components/Slips'
import { type ChatEntry, useConciergeChat } from '@/features/concierge/hooks/useConciergeChat'
import { isSpeechSupported, useSpeech } from '@/features/concierge/hooks/useSpeech'
import { isRecordingSupported, useVoiceRecorder } from '@/features/concierge/hooks/useVoiceRecorder'
import '@/features/concierge/concierge.css'
import { ja } from '@/shared/i18n/ja'
import { TopBar } from '@/shared/ui/TopBar'

const t = ja.concierge

// S16 AI concierge (/concierge). A station ticket counter: ask in Japanese by voice or text,
// get free Seoul events back as printed tickets. Full-screen layout (BARE_PATHS) because the
// counter and the input bar are pinned to the top and bottom.
export function ConciergePage() {
  const chat = useConciergeChat()
  const speech = useSpeech()
  const [draft, setDraft] = useState('')
  const lastEntryRef = useRef<HTMLDivElement | null>(null)
  const thinkingRef = useRef<HTMLDivElement | null>(null)
  const canSpeak = isSpeechSupported()

  // The server rejected the question: give it back so it can be fixed. Text typed while
  // waiting is newer, so it is kept.
  const restoreRejected = (entry: ChatEntry | null) => {
    if (entry?.role !== 'error' || entry.error.kind !== 'invalid') return
    const text = entry.retryText ?? ''
    setDraft((current) => (current.trim() ? current : text))
  }

  const recorder = useVoiceRecorder(async (audio) => {
    const entry = await chat.sendVoice(audio)
    // Asked by voice: answer by voice too.
    if (entry?.role === 'assistant') speech.speak(entry.id, entry.reply.reply)
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
    restoreRejected(await chat.send(text))
  }

  const retry = async () => {
    restoreRejected(await chat.retry())
  }

  const onSendDraft = () => {
    const text = draft
    setDraft('')
    void sendText(text)
  }

  const stopRecording = () => {
    speech.prime()
    recorder.stop()
  }

  const startRecording = () => {
    recorder.clearError()
    speech.cancel()
    void recorder.start()
  }

  // Keep the newest slip in view: a reply starts at its top, a question at the bottom.
  const lastEntry = chat.entries.at(-1)
  useEffect(() => {
    const node = lastEntryRef.current
    if (!node || !lastEntry) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
    node.scrollIntoView({ behavior, block: lastEntry.role === 'user' ? 'end' : 'start' })
  }, [lastEntry])

  const started = chat.entries.length > 0 || chat.pending !== null
  const newestReplyId = [...chat.entries].reverse().find((e) => e.role === 'assistant')?.id
  const busy = chat.pending !== null

  // While waiting, keep the 発券中 line above the input bar.
  useEffect(() => {
    if (busy) thinkingRef.current?.scrollIntoView({ block: 'end' })
  }, [busy, lastEntry])

  const renderEntry = (entry: ChatEntry, isLast: boolean) => {
    switch (entry.role) {
      case 'user':
        return <RequestSlip text={entry.text} number={entry.number} via={entry.via} />
      case 'assistant':
        return (
          <CounterReply
            reply={entry.reply}
            showSuggestions={entry.id === newestReplyId && isLast}
            disabled={busy || recorder.isRecording}
            onSuggestion={(text) => void sendText(text)}
            speaking={speech.speakingId === entry.id}
            onToggleSpeech={
              canSpeak
                ? () =>
                    speech.speakingId === entry.id
                      ? speech.cancel()
                      : speech.speak(entry.id, entry.reply.reply)
                : null
            }
          />
        )
      case 'error':
        return (
          <ErrorSlip
            error={entry.error}
            canRetry={isLast && entry.retryText !== null && !busy}
            onRetry={() => void retry()}
          />
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t.topBarTitle} fallback="/" />
      <h1 className="sr-only">{ja.screens.S16}</h1>

      <div
        className={
          started
            ? 'sticky top-[calc(env(safe-area-inset-top)+52px)] z-[5] border-b border-line/70 bg-app px-gutter pt-1 pb-3'
            : 'px-gutter pt-2 pb-6'
        }
      >
        <CounterWindow mood={recorder.isRecording ? 'listening' : chat.mood} compact={started} />
      </div>

      <section aria-label={t.sign} className="flex flex-1 flex-col gap-4 px-gutter pt-4 pb-8">
        {!started && (
          <div>
            <p className="mb-2 font-mono text-[9px] tracking-[0.16em] text-ink-muted">
              {t.startersLabel}
            </p>
            <ul className="flex flex-col gap-2">
              {t.starters.map((starter) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => void sendText(starter)}
                    disabled={recorder.isRecording}
                    className="w-full rounded-lg border border-dashed border-ink/30 bg-surface px-4 py-3 text-left text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.99] disabled:opacity-40"
                  >
                    「{starter}」
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* New slips and replies are read out by screen readers as they arrive. */}
        <div role="log" aria-live="polite" className="flex flex-col gap-4">
          {chat.entries.map((entry, i) => {
            const isLast = i === chat.entries.length - 1
            return (
              <div
                key={entry.id}
                ref={isLast ? lastEntryRef : undefined}
                data-entry={entry.role}
                className="flex scroll-mt-[calc(env(safe-area-inset-top)+150px)] scroll-mb-28 flex-col"
              >
                {renderEntry(entry, isLast)}
              </div>
            )
          })}

          {busy && (
            <div ref={thinkingRef} className="flex scroll-mb-28 flex-col">
              <ThinkingSlip />
            </div>
          )}
        </div>
      </section>

      <Composer
        draft={draft}
        onDraftChange={(value) => {
          setDraft(value)
          if (notice) recorder.clearError()
        }}
        onSend={onSendDraft}
        busy={busy}
        notice={notice}
        mic={
          isRecordingSupported() && !recorder.denied
            ? {
                isRecording: recorder.isRecording,
                elapsed: recorder.elapsed,
                onStart: startRecording,
                onStop: stopRecording,
              }
            : null
        }
      />
    </div>
  )
}
