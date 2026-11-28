import { MicIcon, StopIcon } from '@/features/concierge/components/icons'
import { ja } from '@/shared/i18n/ja'

const t = ja.concierge.voice.mic

export type MicState = 'ready' | 'listening' | 'busy'

// Heights of the sound bars on each side of the mic while recording (Figma 「mic listening」).
const BARS = [10, 18, 26, 14, 30, 20, 12, 22]

/** Always laid out (hidden when not recording) so the mic never shifts sideways. */
function SoundBars({ visible, flip }: { visible: boolean; flip?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center gap-[3px] transition-opacity duration-200 ease-out motion-reduce:transition-none ${flip ? 'flex-row-reverse' : ''} ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {BARS.map((height, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-[var(--digu-pink)] ${visible ? 'digu-bar' : ''}`}
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
      {/* Soft halo while recording: fades in and stays still (no pulsing rings). */}
      {!small && (
        <span
          aria-hidden="true"
          className={`absolute size-[108px] rounded-full bg-[var(--digu-pink-soft)] transition-opacity duration-200 ease-out motion-reduce:transition-none ${listening ? 'opacity-80' : 'opacity-0'}`}
        />
      )}
      <button
        type="button"
        onClick={listening ? onStop : onStart}
        disabled={state === 'busy'}
        aria-label={listening ? t.stop : t.start}
        className={`relative flex ${size} items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-95 ${color}`}
      >
        {listening && small ? <StopIcon /> : <MicIcon />}
      </button>
    </span>
  )

  if (small) return button
  return (
    <div className="flex w-full items-center justify-center gap-5">
      <SoundBars visible={listening} />
      {button}
      <SoundBars visible={listening} flip />
    </div>
  )
}
