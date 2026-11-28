import {
  fillWithShadow,
  readCardImageStyle,
  roundedRectPath,
  type CardImageStyle,
  type SoftShadow,
} from '@/features/card/lib/cardImageKit'
import { drawSticker, STICKER_REACH } from '@/features/card/lib/drawSticker'
import type { DrawnSticker } from '@/shared/lib/stickers'
import { ja } from '@/shared/i18n/ja'
import lanternPhoto from '@/shared/ui/assets/ticket-lantern.svg'

/** What the card shows: the texts as <PolaroidCard> gets them, and the stickers on it. */
export interface CardImageInput {
  photoUrl: string | null
  title: string
  /** "2026.11.29" */
  dateText: string
  venueText: string
  /** "No.003" */
  numberText: string
  stickers: DrawnSticker[]
}

// The card is drawn by hand in the units of the Figma ExperienceCard (270 x 430), the same
// layout PolaroidCard.tsx builds with cqw, on a canvas three times that size.
const SCALE = 3
const CARD_WIDTH = 270
const CARD_HEIGHT = 430
const CARD_RADIUS = 3
const CARD_SHADOWS: SoftShadow[] = [
  { offsetY: 8, blur: 10, alpha: 0.18 },
  { offsetY: 1, blur: 1, alpha: 0.1 },
]
// Room around the card for its shadow; more when a sticker hangs further over the edge.
const MIN_MARGIN = 20

const PHOTO = { x: 20, y: 24, width: 230, height: 310, radius: 2 }
const PHOTO_PLACEHOLDER_ALPHA = 0.05
// A photo that has not arrived by then counts as failed: the share button must not hang.
const PHOTO_TIMEOUT_MS = 8_000
const TEXT_LEFT = PHOTO.x
const TEXT_RIGHT = PHOTO.x + PHOTO.width
const LINE_HEIGHT = 1.45
const TITLE_SIZE = 14
const META_SIZE = 11
const NUMBER_SIZE = 10
const NUMBER_ALPHA = 0.4
const TITLE_MIDDLE = PHOTO.y + PHOTO.height + 10 + (TITLE_SIZE * LINE_HEIGHT) / 2
const META_MIDDLE =
  PHOTO.y + PHOTO.height + 10 + TITLE_SIZE * LINE_HEIGHT + 2 + (META_SIZE * LINE_HEIGHT) / 2
const META_NUMBER_GAP = 8

/** Margin (in card units) that holds the card shadow and every sticker with its shadow. */
function marginFor(stickers: DrawnSticker[]) {
  let margin = MIN_MARGIN
  for (const sticker of stickers) {
    const reach = sticker.size * CARD_WIDTH * STICKER_REACH
    const x = sticker.x * CARD_WIDTH
    const y = sticker.y * CARD_HEIGHT
    margin = Math.max(margin, reach - x, x + reach - CARD_WIDTH, reach - y, y + reach - CARD_HEIGHT)
  }
  return Math.ceil(margin)
}

/** The picture behind `src`, or null when it cannot be loaded in a way the canvas may read back. */
function decodeImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    // Without this a picture from another origin taints the canvas and no PNG comes out of it.
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/**
 * The card's photo, or null when it cannot be loaded (also when `signal` aborts or it takes too
 * long).
 */
async function loadPhoto(url: string, signal?: AbortSignal) {
  // A local photo (the mock, a fresh pick) is read as it is.
  if (/^(blob|data):/i.test(url)) return decodeImage(url)

  // Fetched by hand instead of through <img crossorigin>: the browser cache may hold the answer
  // the <img> on screen got without CORS, and reusing that one would taint the canvas.
  // TODO(api): the image host must send CORS headers (Access-Control-Allow-Origin) or the shared image has no photo
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timer = setTimeout(abort, PHOTO_TIMEOUT_MS)
  signal?.addEventListener('abort', abort)
  if (signal?.aborted) abort()
  let objectUrl: string | null = null
  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return null
    objectUrl = URL.createObjectURL(await response.blob())
    return await decodeImage(objectUrl)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    // The decoded picture no longer needs the URL.
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

/** `text`, or its start with an ellipsis when it is wider than `maxWidth` (CSS: truncate). */
function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text
  // By code point, so a surrogate pair is never cut in half.
  const letters = Array.from(text)
  while (letters.length > 1) {
    letters.pop()
    const cut = ja.cardDetail.shareImageCut(letters.join('').trimEnd())
    if (context.measureText(cut).width <= maxWidth) return cut
  }
  return ''
}

function drawPhoto(
  context: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  style: CardImageStyle,
) {
  const { x, y, width, height, radius } = PHOTO
  const frame = roundedRectPath(x, y, width, height, radius)
  context.save()
  context.globalAlpha = PHOTO_PLACEHOLDER_ALPHA
  context.fillStyle = style.ink
  context.fill(frame)
  context.restore()
  if (!photo) return

  // Cover: the photo fills the window and is cropped around its centre.
  const zoom = Math.max(width / photo.naturalWidth, height / photo.naturalHeight)
  const drawnWidth = photo.naturalWidth * zoom
  const drawnHeight = photo.naturalHeight * zoom
  context.save()
  context.clip(frame)
  context.drawImage(
    photo,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  )
  context.restore()
}

function drawCaption(
  context: CanvasRenderingContext2D,
  input: CardImageInput,
  style: CardImageStyle,
) {
  context.textBaseline = 'middle'

  context.font = `400 ${TITLE_SIZE}px ${style.fontFamily}`
  context.textAlign = 'left'
  context.fillStyle = style.ink
  context.fillText(fitText(context, input.title, TEXT_RIGHT - TEXT_LEFT), TEXT_LEFT, TITLE_MIDDLE)

  context.font = `700 ${NUMBER_SIZE}px ${style.fontFamily}`
  context.textAlign = 'right'
  context.fillStyle = style.gate
  context.globalAlpha = NUMBER_ALPHA
  context.fillText(input.numberText, TEXT_RIGHT, META_MIDDLE)
  context.globalAlpha = 1
  const numberWidth = context.measureText(input.numberText).width

  // One line like on the card: the date with its separator, then the venue.
  const meta = `${ja.polaroidCard.metaBeforeVenue(input.dateText)}${input.venueText}`
  context.font = `500 ${META_SIZE}px ${style.fontFamily}`
  context.textAlign = 'left'
  context.fillStyle = style.gateInk
  context.fillText(
    fitText(context, meta, TEXT_RIGHT - TEXT_LEFT - numberWidth - META_NUMBER_GAP),
    TEXT_LEFT,
    META_MIDDLE,
  )
}

function paintCard(input: CardImageInput, style: CardImageStyle, photo: HTMLImageElement | null) {
  const margin = marginFor(input.stickers)
  const canvas = document.createElement('canvas')
  canvas.width = (CARD_WIDTH + margin * 2) * SCALE
  canvas.height = (CARD_HEIGHT + margin * 2) * SCALE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no 2d canvas context')

  context.fillStyle = style.page
  context.fillRect(0, 0, canvas.width, canvas.height)

  // From here on the origin is the top-left corner of the card, in card units.
  context.scale(SCALE, SCALE)
  context.translate(margin, margin)

  const paper = roundedRectPath(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
  fillWithShadow(context, paper, style.paper, style.ink, CARD_SHADOWS)
  drawPhoto(context, photo, style)
  drawCaption(context, input, style)
  for (const sticker of input.stickers) {
    drawSticker(
      context,
      sticker,
      sticker.x * CARD_WIDTH,
      sticker.y * CARD_HEIGHT,
      sticker.size * CARD_WIDTH,
      style,
    )
  }
  return canvas
}

function toPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    // toBlob throws (SecurityError) when a drawn photo tainted the canvas.
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('the card image could not be encoded'))
    }, 'image/png')
  })
}

/**
 * The card as one PNG: paper, photo, texts and the badge stickers at their places, with a
 * margin in the page colour so stickers that hang over the edge are not cut. `signal` stops the
 * download of the photo when the image is no longer wanted.
 */
export async function renderCardImage(input: CardImageInput, signal?: AbortSignal): Promise<Blob> {
  const style = readCardImageStyle()
  // The card on screen uses the same font, so this normally resolves at once.
  await document.fonts?.ready.catch(() => undefined)

  // A card without any photo gets the lantern picture, like <PolaroidCard>. A photo that exists
  // but cannot be loaded leaves the window empty instead: the lantern would pass for the photo.
  const photo = input.photoUrl
    ? await loadPhoto(input.photoUrl, signal)
    : await decodeImage(lanternPhoto)
  // Nobody waits for a cancelled image: skip the painting and the encoding.
  if (signal?.aborted) throw new DOMException('the card image is no longer wanted', 'AbortError')
  try {
    return await toPngBlob(paintCard(input, style, photo))
  } catch (error) {
    if (!photo) throw error
    // The photo could be drawn but not read back: the card goes out without it. A new canvas,
    // because a tainted one stays tainted.
    return toPngBlob(paintCard(input, style, null))
  }
}
