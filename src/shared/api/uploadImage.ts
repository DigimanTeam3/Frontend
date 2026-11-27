import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { resizeImage } from '@/shared/lib/resizeImage'
import type { UploadedImage } from '@/shared/types/upload'

/**
 * Multipart body with one part named `file`, built by hand with its own boundary.
 * apiClient adds "Content-Type: application/json" to every body that comes without a Content-Type,
 * which would break a FormData upload (the browser could no longer add its boundary). Sending the
 * multipart Content-Type ourselves keeps the shared client as it is.
 */
function multipartImage(file: File) {
  const boundary = `----digiman${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  // Fixed ASCII file name: a phone's file name may hold quotes or non-ASCII text, and the server
  // names the stored file itself.
  const extension = /^image\/([a-z0-9]+)$/.exec(file.type)?.[1] ?? 'bin'
  const head =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="photo.${extension}"\r\n` +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
  return {
    body: new Blob([head, file, `\r\n--${boundary}--\r\n`]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

/**
 * Shrinks a photo (longest edge 1600px, JPEG) and uploads it: POST /api/uploads/images,
 * multipart field `file`. Login needed.
 * Errors: 400 UNSUPPORTED_IMAGE_TYPE, 400 EMPTY_FILE, 413 FILE_TOO_LARGE.
 */
export async function uploadImage(file: File) {
  const { body, contentType } = multipartImage(await resizeImage(file))
  return apiClient<UploadedImage>('/uploads/images', {
    method: 'POST',
    body,
    headers: { 'Content-Type': contentType },
  })
}

export function useUploadImageMutation() {
  return useMutation({ mutationFn: uploadImage })
}
