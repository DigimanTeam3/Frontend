import { MicIcon, StopIcon } from '@/features/concierge/components/icons'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge.voice.mic

export type MicState = 'ready' | 'listening' | 'busy'

// Heights of the sound bars on each side of the mic while recording (Figma 「mic listening」).
const BARS = [10, 18, 26, 14, 30, 20, 12, 22]

function SoundBars({ flip }: { flip?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center gap-[3px] ${flip ? 'flex-row-reverse' : ''}`}
    >
      {BARS.map((height, i) => (
        <span
          key={i}
          className="digu-bar w-[3px] rounded-full bg-[var(--digu-pink)]"
          style={{ height, animationDelay: `${(i % 4) * 0.12}s` }}
        />
      ))}
    </span>
  )
}

/**
 * The big round mic (Figma 「mic ready」 / 「mic listening」). `small` is the 52px one in the
 * bottom bar of the ticket list.
 */
export function MicButton({
  state,
  onStart,
  onStop,
  small = false,
}: {
  state: MicState
  onStart: () => void
  onStop: () => void
  small?: boolean
}) {
  const listening = state === 'listening'
  const size = small ? 'size-[52px]' : 'size-[76px]'
  const color = listening
    ? 'bg-[var(--digu-pink)] text-white'
    : state === 'busy'
      ? 'bg-[#e8e5df] text-[var(--digu-ink-mute)]'
      : 'bg-[var(--digu-ink)] text-white shadow-[0_8px_18px_-8px_rgba(26,28,38,0.6)]'

  const button = (
    <span className="relative flex items-center justify-center">
      {listening && !small && (
        <>
          <span
            aria-hidden="true"
            className="digu-ring absolute size-[76px] rounded-full bg-[var(--digu-pink)]/30"
          />
          <span
            aria-hidden="true"
            className="digu-ring absolute size-[76px] rounded-full bg-[var(--digu-pink)]/25"
            style={{ animationDelay: '0.6s' }}
          />
          <span
            aria-hidden="true"
            className="absolute size-[132px] rounded-full bg-[var(--digu-pink-soft)]/70"
          />
        </>
      )}
      <button
        type="button"
        onClick={listening ? onStop : onStart}
        disabled={state === 'busy'}
        aria-label={listening ? t.stop : t.start}
        aria-pressed={listening}
        className={`relative flex ${size} items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-95 ${color}`}
      >
        {listening && small ? <StopIcon /> : <MicIcon />}
      </button>
    </span>
  )

  if (small) return button
  return (
    <div className="flex w-full items-center justify-center gap-5">
      {listening && <SoundBars />}
      {button}
      {listening && <SoundBars flip />}
    </div>
  )
}
