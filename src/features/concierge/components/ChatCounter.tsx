import { useEffect, useRef } from 'react'
import { Composer } from '@/features/concierge/components/Composer'
import { CounterReply } from '@/features/concierge/components/CounterReply'
import { CounterWindow } from '@/features/concierge/components/CounterWindow'
import { MicIcon } from '@/features/concierge/components/icons'
import { ErrorSlip, RequestSlip, ThinkingSlip } from '@/features/concierge/components/Slips'
import type { ChatEntry } from '@/features/concierge/hooks/useConciergeChat'
import type { ConciergeSession } from '@/features/concierge/hooks/useConciergeSession'
import { isSpeechSupported } from '@/features/concierge/hooks/useSpeech'
import { isRecordingSupported } from '@/features/concierge/hooks/useVoiceRecorder'
import { ja } from '@/shared/i18n/ja'
import { TopBar } from '@/shared/ui/TopBar'

const t = ja.concierge

/**
 * The chat counter: ask by text (or the small mic), get tickets back as slips in a log.
 * Opened from the voice counter's 「文字で」; 「声で」 goes back with the same conversation.
 */
export function ChatCounter({ session }: { session: ConciergeSession }) {
  const { chat, speech, recorder, notice, draft, setDraft } = session
  const lastEntryRef = useRef<HTMLDivElement | null>(null)
  const thinkingRef = useRef<HTMLDivElement | null>(null)
  const canSpeak = isSpeechSupported()

  const onSendDraft = () => {
    const text = draft
    setDraft('')
    void session.sendText(text)
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
            onSuggestion={(text) => void session.sendText(text)}
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
            onRetry={() => void session.retry()}
          />
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={t.topBarTitle}
        fallback="/"
        trailing={
          <button
            type="button"
            onClick={() => session.setView('voice')}
            disabled={recorder.isRecording}
            aria-label={t.voice.toVoiceLabel}
            className="mr-1.5 flex min-h-10 items-center gap-1 rounded-full bg-surface px-3 text-xs font-bold shadow-[0_1px_0_rgba(30,34,48,0.08)] transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40 [&_svg]:size-4"
          >
            <MicIcon />
            <span className="text-ink-muted">{t.voice.toVoice}</span>
          </button>
        }
      />

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
                    onClick={() => void session.sendText(starter)}
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
                onStart: session.startRecording,
                onStop: session.stopRecording,
              }
            : null
        }
      />
    </div>
  )
}
