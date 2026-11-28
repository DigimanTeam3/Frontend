import { ja } from '@/shared/i18n/ja'
import { Button } from '@/shared/ui/Button'
import { PinIcon } from '@/shared/ui/icons/PinIcon'

export interface CheckInIntroProps {
  /** How far from the venue the check-in passes, in meters. */
  radiusM: number
  /** The check is running: the button shows it and cannot be tapped again. */
  busy: boolean
  onStart: () => void
}

// Stage "intro" (Figma: S09 はじめる前): says what the check does before the browser asks for
// the location permission.
export function CheckInIntro({ radiusM, busy, onStart }: CheckInIntroProps) {
  const { intro } = ja.checkIn
  const steps = [intro.stepPermission, intro.stepRadius(radiusM), intro.stepTear]

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-5 pb-6">
        {/* Shrinks on short screens so the button stays in view. */}
        <div
          aria-hidden="true"
          className="bg-gate flex size-[min(220px,30dvh)] shrink-0 items-center justify-center rounded-full text-white"
        >
          <PinIcon />
        </div>
        <h1 className="text-center font-mincho text-2xl leading-[1.3] font-extrabold tracking-[0.01em] text-ink">
          {intro.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        {/* Under 375px the longer line (25 characters) no longer fits at 13px. One size smaller
            keeps it on one line at 360px; text-balance splits it evenly on anything narrower. */}
        <p className="text-center text-[13px] leading-[1.6] text-ink-muted max-[374px]:text-xs">
          {intro.body.map((line) => (
            <span key={line} className="block text-balance">
              {line}
            </span>
          ))}
        </p>
        <ol className="flex w-full flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="bg-gate/15 text-gate flex size-6 shrink-0 items-center justify-center rounded-full text-xs leading-normal font-bold"
              >
                {index + 1}
              </span>
              <span className="min-w-0 text-[13px] leading-[1.6] text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="accent" fullWidth disabled={busy} aria-busy={busy} onClick={onStart}>
          {busy ? ja.checkIn.checking : intro.start}
        </Button>
        <p className="text-center text-xs leading-normal text-ink-faint">{intro.httpsNote}</p>
      </div>
    </>
  )
}
