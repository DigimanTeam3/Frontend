import { type FormEvent, type KeyboardEvent, useId } from 'react'
import { MicIcon, SendIcon, StopIcon } from '@/features/concierge/components/icons'
import { MAX_QUESTION_LENGTH } from '@/features/concierge/hooks/useConciergeChat'
import { MAX_RECORDING_SECONDS } from '@/features/concierge/hooks/useVoiceRecorder'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge.composer
const RING = 2 * Math.PI * 26.5

export interface ComposerProps {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  busy: boolean
  /** null when this browser cannot record. */
  mic: {
    isRecording: boolean
    elapsed: number
    onStart: () => void
    onStop: () => void
  } | null
  notice: string | null
}

const clock = (seconds: number) => `0:${String(seconds).padStart(2, '0')}`

/** Bottom bar: text box (always there) and the microphone. Sits above the home indicator. */
export function Composer({ draft, onDraftChange, onSend, busy, mic, notice }: ComposerProps) {
  const inputId = useId()
  const recording = mic?.isRecording ?? false
  const canSend = !busy && !recording && draft.trim().length > 0
  const progress = mic ? Math.min(mic.elapsed / MAX_RECORDING_SECONDS, 1) : 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (canSend) onSend()
  }

  // Enter that confirms Japanese IME conversion must not send the question.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault()
    }
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-app/95 px-gutter pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
      {notice && (
        <p role="alert" className="mb-2 text-[13px] leading-[1.5] font-bold text-danger">
          {notice}
        </p>
      )}
      <form onSubmit={submit} className="flex items-center gap-2.5">
        {mic && (
          <button
            type="button"
            onClick={recording ? mic.onStop : mic.onStart}
            disabled={busy && !recording}
            aria-label={recording ? t.stop : t.mic}
            aria-pressed={recording}
            className={`relative flex size-12 shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-95 disabled:opacity-40 ${
              recording ? 'bg-danger text-surface' : 'bg-ink text-surface'
            }`}
          >
            {recording ? <StopIcon /> : <MicIcon />}
            {recording && (
              <svg
                aria-hidden="true"
                viewBox="0 0 56 56"
                className="pointer-events-none absolute -inset-1 size-14 -rotate-90"
              >
                <circle
                  cx="28"
                  cy="28"
                  r="26.5"
                  fill="none"
                  stroke="currentColor"
                  className="concierge-ring text-ink"
                  strokeWidth="3"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - progress)}
                />
              </svg>
            )}
          </button>
        )}

        {recording && mic ? (
          <p
            role="status"
            className="flex h-12 flex-1 items-center justify-between rounded-full border border-danger/40 bg-surface px-4"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <span aria-hidden="true" className="concierge-dot size-2 rounded-full bg-danger" />
              {t.recording}
            </span>
            <span className="font-mono text-xs text-ink-muted">
              {clock(mic.elapsed)} / {clock(MAX_RECORDING_SECONDS)}
            </span>
          </p>
        ) : (
          <div className="relative flex-1">
            <label htmlFor={inputId} className="sr-only">
              {t.label}
            </label>
            <input
              id={inputId}
              type="text"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_QUESTION_LENGTH}
              enterKeyHint="send"
              autoComplete="off"
              placeholder={t.placeholder}
              className="h-12 w-full rounded-full border border-line bg-surface pr-14 pl-4 text-[15px] placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t.send}
              className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full bg-ink text-surface transition-opacity duration-150 disabled:opacity-25"
            >
              <SendIcon />
            </button>
          </div>
        )}
      </form>
      {draft.length > MAX_QUESTION_LENGTH - 40 && !recording && (
        <p className="mt-1 text-right font-mono text-[10px] text-ink-muted">
          {t.maxLength(draft.length, MAX_QUESTION_LENGTH)}
        </p>
      )}
    </div>
  )
}
