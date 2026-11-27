import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useUpdateCardMutation } from '@/features/card/api'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/lib/apiError'
import type { ExperienceCard } from '@/shared/types/card'
import { Button } from '@/shared/ui/Button'
import { AlertIcon } from '@/shared/ui/icons/AlertIcon'

export interface MemoEditorProps {
  card: ExperienceCard
  onSaved: () => void
  onCancel: () => void
}

// The counter shows text.length (UTF-16 units), which is what maxLength limits.
const MEMO_MAX_LENGTH = 500

type ErrorKey = keyof typeof ja.cardDetail.memoErrors

// The memo of the card as a form (S14, after "メモを編集"): textarea with a counter, save and
// cancel. A failed save keeps the text for another try.
export function MemoEditor({ card, onSaved, onCancel }: MemoEditorProps) {
  const { cardDetail: copy } = ja
  const textId = useId()
  const counterId = useId()
  const field = useRef<HTMLTextAreaElement>(null)
  const update = useUpdateCardMutation(card.id)
  const [text, setText] = useState(card.memo ?? '')

  const saving = update.isPending
  const errorKey: ErrorKey | null = !update.isError
    ? null
    : apiErrorCode(update.error) === 'VALIDATION_ERROR'
      ? 'VALIDATION_ERROR'
      : 'UNKNOWN'

  // The form replaces the memo text: writing goes on at the end of what is there.
  useEffect(() => {
    const textarea = field.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const memo = text.trim()
    // An emptied memo is removed.
    update.mutate({ memo: memo === '' ? null : memo }, { onSuccess: onSaved })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1.5 py-3">
      <label htmlFor={textId} className="text-gate text-[13px] leading-normal">
        {copy.memoLabel}
      </label>
      {/* 16px text: iOS Safari zooms the page when a focused field is smaller. */}
      <textarea
        ref={field}
        id={textId}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          // The message of the last try no longer fits once the text changes.
          if (update.isError) update.reset()
        }}
        maxLength={MEMO_MAX_LENGTH}
        aria-describedby={counterId}
        readOnly={saving}
        className="h-[120px] w-full resize-none rounded-[10px] border-[1.5px] border-line bg-surface px-3.5 py-3 text-base leading-[1.65] text-ink outline-none focus:border-ink"
      />
      <p id={counterId} className="text-ink-faint text-xs leading-normal">
        {copy.memoCounter(text.length, MEMO_MAX_LENGTH)}
      </p>
      {errorKey && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[10px] bg-danger/10 px-3.5 py-3 text-[13px] leading-[1.6] text-ink"
        >
          <AlertIcon className="size-5 shrink-0 text-danger" />
          <span className="min-w-0">{copy.memoErrors[errorKey]}</span>
        </p>
      )}
      <div className="flex gap-2.5 pt-1.5">
        <Button
          variant="ghost"
          size="sm"
          shape="pill"
          className="flex-1"
          disabled={saving}
          onClick={onCancel}
        >
          {copy.cancelMemo}
        </Button>
        <Button
          type="submit"
          variant="accent"
          size="sm"
          shape="pill"
          className="flex-1"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? copy.savingMemo : copy.saveMemo}
        </Button>
      </div>
    </form>
  )
}
