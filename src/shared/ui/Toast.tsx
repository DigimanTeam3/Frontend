import { useEffect, useRef } from 'react'
import { CheckIcon } from '@/shared/ui/icons/CheckIcon'

export const TOAST_DURATION_MS = 2500

export interface ToastProps {
  /** Text to show. null hides the toast. */
  message: string | null
  /** Called when the toast has been shown long enough. Set `message` back to null here. */
  onDismiss: () => void
  durationMs?: number
}

// Short confirmation at the bottom of the screen (Figma: ui / Toast). The screen that shows it
// keeps the message in its own state: <Toast message={toast} onDismiss={() => setToast(null)} />.
export function Toast({ message, onDismiss, durationMs = TOAST_DURATION_MS }: ToastProps) {
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (message === null) return
    const timer = setTimeout(() => onDismissRef.current(), durationMs)
    return () => clearTimeout(timer)
  }, [message, durationMs])

  return (
    // The live region stays mounted so screen readers announce a message when it appears.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+80px)] z-20 mx-auto w-full max-w-[430px] px-6"
    >
      {message !== null && (
        <div className="flex items-center gap-2 rounded-[14px] bg-ink px-4 py-3 text-white">
          <CheckIcon className="size-5 shrink-0 text-gate" />
          <p className="min-w-0 flex-1 text-[13px] leading-[1.6]">{message}</p>
        </div>
      )}
    </div>
  )
}
