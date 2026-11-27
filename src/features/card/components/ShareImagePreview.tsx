import { useEffect, useId, useRef } from 'react'
import { ja } from '@/shared/i18n/ja'
import { buttonClassName } from '@/shared/ui/buttonStyles'

export interface ShareImagePreviewProps {
  /** Object URL of the card image made for sharing. The owner frees it (see useShareCard). */
  imageUrl: string
  /** Close button or Escape. The opener takes the focus back. */
  onClose: () => void
}

// The share image on screen (S14), for browsers that cannot hand a file to the share sheet: the
// download started with it often does nothing in in-app browsers (LINE), but a long press on an
// image saves it everywhere.
export function ShareImagePreview({ imageUrl, onClose }: ShareImagePreviewProps) {
  const { sharePreview: copy } = ja.cardDetail
  const titleId = useId()
  const hintId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      } else if (event.key === 'Tab') {
        // The close button is the only control: the focus stays on it, off the page behind.
        event.preventDefault()
        closeButton.current?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    // The page behind must not scroll under the dialog.
    const pageOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = pageOverflow
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={hintId}
      className="fixed inset-0 z-30 flex flex-col items-center gap-4 overflow-y-auto bg-ink/80 px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)]"
    >
      <h2 id={titleId} className="mt-auto text-base leading-normal font-bold text-white">
        {copy.title}
      </h2>
      {/* No pointer-events or user-select tricks here: the long press must reach the image. */}
      <img
        src={imageUrl}
        alt={copy.imageAlt}
        className="max-h-[55dvh] max-w-full shrink-0 rounded-[10px] object-contain"
      />
      <p id={hintId} className="text-center text-[13px] leading-[1.6] text-white">
        {copy.hint}
      </p>
      <button
        type="button"
        ref={closeButton}
        onClick={onClose}
        className={`${buttonClassName({ variant: 'outline', shape: 'pill' })} mb-auto w-full max-w-[310px]`}
      >
        {copy.close}
      </button>
    </div>
  )
}
