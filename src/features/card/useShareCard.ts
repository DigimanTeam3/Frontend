import { useRef, useState } from 'react'
import { renderCardImage } from '@/features/card/lib/renderCardImage'
import type { DrawnSticker } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import type { ExperienceCard } from '@/shared/types/card'

// The browser keeps reading the object URL for a moment after the click that starts a download.
const REVOKE_DELAY_MS = 10_000

const cardFileName = (cardId: number) => `digiman-card-${cardId}.png`

/** The user closed the share sheet without sharing. */
function isAbortError(error: unknown) {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

export interface ShareCard {
  share: () => void
  /** The image is being made: the share button shows its busy label. */
  preparing: boolean
}

/**
 * Shares a card as one image (S14 "共有する"): the phone's share sheet where it takes files,
 * else a download. `notify` shows a toast message.
 */
export function useShareCard(
  card: ExperienceCard,
  stickers: DrawnSticker[],
  notify: (message: string) => void,
): ShareCard {
  const [preparing, setPreparing] = useState(false)
  // Also covers the time the share sheet is open: a second share() call would be refused.
  const busy = useRef(false)

  const run = async () => {
    const { cardDetail: copy } = ja
    const { photoUrl, title, dateText, venueText, numberText } = polaroidCardText(card)
    setPreparing(true)
    let file: File
    try {
      const image = await renderCardImage({
        photoUrl,
        title,
        dateText,
        venueText,
        numberText,
        stickers,
      })
      file = new File([image], cardFileName(card.id), { type: image.type })
    } finally {
      setPreparing(false)
    }

    // Desktop browsers and some in-app browsers cannot share files: the image is saved instead.
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title })
    } else {
      downloadFile(file)
      notify(copy.imageSaved)
    }
  }

  const share = () => {
    if (busy.current) return
    busy.current = true
    run()
      .catch((error: unknown) => {
        if (!isAbortError(error)) notify(ja.cardDetail.shareFailed)
      })
      .finally(() => {
        busy.current = false
      })
  }

  return { share, preparing }
}
