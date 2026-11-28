import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { MESSAGE_MAX_LENGTH, textLength } from '@/features/companion/talkApi'
import { ja } from '@/shared/i18n/ja'

const text = ja.companionChat
/** The input grows with its text up to about five lines, then scrolls. */
const MAX_INPUT_HEIGHT = 120

export interface ChatComposerProps {
  onSend: (content: string) => void
  /** The chat screen measures the bar to keep the last message above it. */
  ref?: Ref<HTMLFormElement>
}

// Phones have no Shift+Enter: there Enter adds a line and the button sends, as in LINE.
function enterAddsLine() {
  return window.matchMedia('(pointer: coarse)').matches
}

// Input bar pinned to the bottom of the chat screen. With a keyboard, Enter sends and
// Shift+Enter adds a line. Enter that confirms a Japanese IME conversion only confirms it.
export function ChatComposer({ onSend, ref }: ChatComposerProps) {
  const [touch] = useState(enterAddsLine)
  const inputId = useId()
  const counterId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const length = textLength(value)
  const tooLong = length > MESSAGE_MAX_LENGTH
  const canSend = length > 0 && !tooLong

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }, [value])

  const submit = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // keyCode 229: Safari reports the Enter that ends a conversion this way.
    const composing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key === 'Enter' && !event.shiftKey && !composing && !touch) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      ref={ref}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-app border-t border-line bg-surface px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"
    >
      <div className="flex items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          {text.inputLabel}
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          value={value}
          rows={1}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={text.placeholder}
          enterKeyHint={touch ? 'enter' : 'send'}
          aria-describedby={counterId}
          aria-invalid={tooLong || undefined}
          className="min-h-10 min-w-0 flex-1 resize-none rounded-[20px] bg-surface-2 px-4 py-2.5 text-sm leading-[1.4] placeholder:text-ink-faint focus:ring-2 focus:ring-gate focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="h-10 shrink-0 rounded-full bg-ink px-4 text-sm font-bold text-white transition-opacity disabled:opacity-30"
        >
          {text.send}
        </button>
      </div>
      {/* The counter appears near the limit, so short chats stay quiet. */}
      <p
        id={counterId}
        className={`mt-1 px-2 text-[11px] ${tooLong ? 'text-danger' : 'text-ink-muted'} ${
          length >= MESSAGE_MAX_LENGTH * 0.8 ? '' : 'sr-only'
        }`}
      >
        {tooLong ? text.tooLong(MESSAGE_MAX_LENGTH) : text.length(length, MESSAGE_MAX_LENGTH)}
      </p>
    </form>
  )
}
