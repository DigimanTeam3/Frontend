import { useEffect, useRef, useState } from 'react'
import { renderCardImage, type CardImageInput } from '@/features/card/lib/renderCardImage'
import type { DrawnSticker } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import type { ExperienceCard } from '@/shared/types/card'

// The browser keeps reading the object URL for a moment after the click that starts a download.
const REVOKE_DELAY_MS = 10_000

const cardFileName = (cardId: number) => `digiman-card-${cardId}.png`

function hasErrorName(error: unknown, name: string) {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === name
}

/** The user closed the share sheet without sharing. */
const isAbortError = (error: unknown) => hasErrorName(error, 'AbortError')

/** The browser refused share(): it was not called inside a tap (the tap had to wait). */
const isNotAllowedError = (error: unknown) => hasErrorName(error, 'NotAllowedError')

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

/** One run of renderCardImage. `file` is set as soon as the image is there. */
interface ImageBuild {
  promise: Promise<File>
  file: File | null
  failed: boolean
  cancel: () => void
}

function startBuild(input: CardImageInput, fileName: string): ImageBuild {
  const controller = new AbortController()
  const build: ImageBuild = {
    file: null,
    failed: false,
    cancel: () => controller.abort(),
    promise: renderCardImage(input, controller.signal).then(
      (image) => {
        build.file = new File([image], fileName, { type: image.type })
        return build.file
      },
      (error: unknown) => {
        build.failed = true
        throw error
      },
    ),
  }
  // A failure is reported by the tap that waits for the image; before that nobody listens.
  build.promise.catch(() => undefined)
  return build
}

export interface ShareCard {
  share: () => void
  /** The image is being made: the share button shows its busy label. */
  preparing: boolean
  /**
   * Set where files cannot be shared: object URL of the image, to show it so it can be saved by
   * hand. Freed by this hook when the preview closes or the screen does.
   */
  previewUrl: string | null
  closePreview: () => void
}

/**
 * Shares a card as one image (S14 "共有する"): the phone's share sheet where it takes files,
 * else a download plus the image on screen. `notify` shows a toast message.
 */
export function useShareCard(
  card: ExperienceCard,
  stickers: DrawnSticker[],
  notify: (message: string) => void,
): ShareCard {
  const [preparing, setPreparing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Also covers the time the share sheet is open: a second share() call would be refused.
  const busy = useRef(false)
  const buildRef = useRef<ImageBuild | null>(null)

  const { photoUrl, title, dateText, venueText, numberText } = polaroidCardText(card)
  const fileName = cardFileName(card.id)
  // As text, so the image is made again only when something it shows changes, not on every
  // render (the sticker list is a new array each time) and not when only the memo changes.
  const imageKey = JSON.stringify({
    photoUrl,
    title,
    dateText,
    venueText,
    numberText,
    stickers,
  } satisfies CardImageInput)

  // The image is made ahead of the tap. iOS only opens the share sheet when share() is called
  // right inside the tap; after waiting for the image the tap no longer counts.
  useEffect(() => {
    buildRef.current = startBuild(JSON.parse(imageKey) as CardImageInput, fileName)
    return () => {
      buildRef.current?.cancel()
      buildRef.current = null
    }
  }, [imageKey, fileName])

  // Free the preview image when it is closed or replaced, or the screen closes.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  /** The image of the card as it is now; waits for the build that is running. */
  const builtFile = async () => {
    for (;;) {
      const build = buildRef.current
      // The screen closed while the tap waited: nothing to show, nothing to report.
      if (!build) throw new DOMException('the card screen closed', 'AbortError')
      try {
        const file = await build.promise
        if (buildRef.current === build) return file
      } catch (error) {
        if (buildRef.current === build) throw error
      }
      // The card changed meanwhile: wait for the new image.
    }
  }

  // No await before navigator.share(): called with a finished file, this runs inside the tap.
  const send = async (file: File) => {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title })
      return
    }
    // Desktop browsers and some in-app browsers cannot share files: the image is saved instead.
    // In-app browsers (LINE) often ignore the download, so the image is also shown.
    downloadFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const waitThenSend = async () => {
    setPreparing(true)
    let file: File
    try {
      file = await builtFile()
    } finally {
      setPreparing(false)
    }
    await send(file)
  }

  const share = () => {
    if (busy.current) return
    busy.current = true
    // An image that could not be made gets a new try with this tap.
    if (buildRef.current?.failed) {
      buildRef.current = startBuild(JSON.parse(imageKey) as CardImageInput, fileName)
    }
    const file = buildRef.current?.file
    const sending = file ? send(file) : waitThenSend()
    sending
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        // The image is ready by now, so the next tap opens the share sheet.
        notify(isNotAllowedError(error) ? ja.cardDetail.shareTapAgain : ja.cardDetail.shareFailed)
      })
      .finally(() => {
        busy.current = false
      })
  }

  return { share, preparing, previewUrl, closePreview: () => setPreviewUrl(null) }
}
