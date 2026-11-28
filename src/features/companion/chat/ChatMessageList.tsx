import { Fragment } from 'react'
import { InitialAvatar } from '@/features/companion/components/InitialAvatar'
import type { PendingMessage } from '@/features/companion/chat/useChatRoom'
import { formatDay, formatTime } from '@/shared/i18n/format'
import { ja } from '@/shared/i18n/ja'
import type { CompanionMessage } from '@/shared/types/companionChat'

const text = ja.companionChat

export interface ChatMessageListProps {
  messages: CompanionMessage[]
  pending: PendingMessage[]
  onResend: (localId: string) => void
  onDiscard: (localId: string) => void
}

// Group chat: mine on the right, others on the left with their name, since there can be
// several people. Text is rendered as plain text only (React escapes it).
export function ChatMessageList({ messages, pending, onResend, onDiscard }: ChatMessageListProps) {
  return (
    <ol aria-live="polite" aria-relevant="additions" className="flex flex-col gap-1.5">
      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const day = formatDay(message.createdAt)
        const newDay = !previous || formatDay(previous.createdAt) !== day
        // The name and avatar start a run of messages from one person.
        const firstOfRun = newDay || previous.sender.id !== message.sender.id
        return (
          <Fragment key={message.id}>
            {newDay && <DayDivider label={day} />}
            {message.isMine ? (
              <MineBubble content={message.content} time={message.createdAt} spaced={firstOfRun} />
            ) : (
              <OtherBubble message={message} firstOfRun={firstOfRun} />
            )}
          </Fragment>
        )
      })}
      {pending.map((item) => (
        <li key={item.localId} className="flex flex-col items-end gap-1 pt-1">
          <div className="flex max-w-[80%] items-end gap-1.5">
            <span className="shrink-0 text-[10px] text-ink-muted">
              {item.status === 'sending' ? text.sending : null}
            </span>
            <p
              className={`rounded-2xl rounded-br-md px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                item.status === 'failed'
                  ? 'border border-danger bg-surface text-ink'
                  : 'bg-gate/60 text-ink'
              }`}
            >
              {item.content}
            </p>
          </div>
          {item.status === 'failed' && (
            <div role="alert" className="flex items-center gap-2 text-xs">
              <span className="text-danger">{text.failed}</span>
              <button
                type="button"
                onClick={() => onResend(item.localId)}
                className="rounded-md px-2 py-1 font-bold text-gate-ink active:bg-ink/5"
              >
                {text.resend}
              </button>
              <button
                type="button"
                onClick={() => onDiscard(item.localId)}
                className="rounded-md px-2 py-1 text-ink-muted active:bg-ink/5"
              >
                {text.discard}
              </button>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

function DayDivider({ label }: { label: string }) {
  return (
    <li className="my-2 flex justify-center">
      <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] text-ink-muted">
        {label}
      </span>
    </li>
  )
}

function MineBubble({ content, time, spaced }: { content: string; time: string; spaced: boolean }) {
  return (
    <li className={`flex justify-end ${spaced ? 'pt-2' : ''}`}>
      <div className="flex max-w-[80%] items-end gap-1.5">
        <time dateTime={time} className="shrink-0 text-[10px] text-ink-muted">
          {formatTime(time)}
        </time>
        <p className="rounded-2xl rounded-br-md bg-gate px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink">
          {content}
        </p>
      </div>
    </li>
  )
}

function OtherBubble({ message, firstOfRun }: { message: CompanionMessage; firstOfRun: boolean }) {
  return (
    <li className={`flex gap-2 ${firstOfRun ? 'pt-2' : ''}`}>
      {/* Keeps bubbles of one run lined up under the first avatar. */}
      <span className="w-7 shrink-0">
        {firstOfRun && <InitialAvatar name={message.sender.nickname} size="sm" />}
      </span>
      <div className="flex max-w-[80%] min-w-0 flex-col gap-1">
        {firstOfRun && (
          <p className="truncate text-[11px] font-bold text-ink-muted">{message.sender.nickname}</p>
        )}
        <div className="flex items-end gap-1.5">
          <p className="min-w-0 rounded-2xl rounded-tl-md border border-line bg-surface px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
          <time dateTime={message.createdAt} className="shrink-0 text-[10px] text-ink-muted">
            {formatTime(message.createdAt)}
          </time>
        </div>
      </div>
    </li>
  )
}
