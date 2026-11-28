import type { ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge.voice

// Longer than this reads better in the smaller bubble text (real replies run to 2〜4 lines).
const LONG_TEXT = 36

/** Reply text as plain React text: one line per line break, no HTML. */
function Lines({ text }: { text: string }) {
  return text.split('\n').map((line, i) => (
    <span key={i} className="block min-h-[1lh] break-words">
      {line}
    </span>
  ))
}

/** What ディグ says (Figma 「bubble ディグ」): white, tail toward ディグ. */
export function DiguBubble({
  text,
  status,
  tail = 'down',
  size: sizeProp,
  children,
}: {
  text: string
  /** Small grey text after the name, e.g. 話しています. */
  status?: string | null
  tail?: 'down' | 'left'
  /** Defaults to large for short lines and medium for long replies. */
  size?: 'lg' | 'md'
  children?: ReactNode
}) {
  const size = sizeProp ?? (text.length > LONG_TEXT ? 'md' : 'lg')
  return (
    <div
      className={`digu-pop relative max-w-full rounded-[22px] bg-white px-[18px] pt-3.5 pb-4 text-[var(--digu-ink)] shadow-[0_6px_9px_rgba(26,28,38,0.1)] ${tail === 'down' ? 'digu-tail-down' : 'digu-tail-left'}`}
    >
      <p className="flex items-center gap-1.5 text-xs leading-[1.5]">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--digu-pink)]" />
        <span className="font-bold text-[var(--digu-pink)]">{t.digu}</span>
        {status && <span className="text-[var(--digu-ink-mute)]">{status}</span>}
      </p>
      <p
        className={`relative mt-1.5 font-bold ${size === 'lg' ? 'text-lg leading-[1.45]' : 'text-[15px] leading-[1.65]'}`}
      >
        <Lines text={text} />
      </p>
      {children}
    </div>
  )
}

/**
 * What the visitor said (Figma 「bubble あなた」): ink, tail toward the bottom right.
 * `past` is the dimmed one kept above ディグ's answer.
 */
export function YouBubble({ text, past = false }: { text: string | null; past?: boolean }) {
  return (
    <div
      className={`digu-pop digu-tail-down digu-tail-end relative max-w-[min(100%,320px)] min-w-[min(100%,200px)] self-end rounded-[22px] px-[18px] pt-3.5 pb-4 shadow-[0_6px_9px_rgba(26,28,38,0.1)] transition-colors duration-200 ease-out motion-reduce:transition-none ${past ? 'bg-[#8c8e93] text-white/75' : 'bg-[var(--digu-ink)] text-white'}`}
    >
      <p className="flex items-center gap-1.5 text-xs leading-[1.5] text-[#d5d8de]">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        <span className="font-bold">{t.you}</span>
        {text === null && <span>{t.hearing}</span>}
      </p>
      {text === null ? (
        <p aria-hidden="true" className="mt-1.5 flex h-[26px] items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="concierge-dot size-2 rounded-full bg-[var(--digu-pink)]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </p>
      ) : (
        <p
          className={`mt-1.5 font-bold break-words ${past ? 'text-sm leading-[1.6]' : 'text-lg leading-[1.45]'}`}
        >
          {past ? t.quote(text) : text}
        </p>
      )}
    </div>
  )
}
