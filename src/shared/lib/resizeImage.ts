export const MAX_IMAGE_EDGE_PX = 1600
const JPEG_QUALITY = 0.8

/**
 * Shrinks a photo before upload: longest edge <= MAX_IMAGE_EDGE_PX, re-encoded as JPEG.
 * Phone photos are several MB; this keeps uploads fast and EC2 storage small.
 * Returns the original file if it is already small enough or cannot be decoded.
 */
export async function resizeImage(file: File, maxEdge = MAX_IMAGE_EDGE_PX): Promise<File> {
  let bitmap: ImageBitmap
  try {
    // from-image applies the EXIF rotation so portrait photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.type === 'image/jpeg') {
    bitmap.close()
    return file
  }

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) return file

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}
