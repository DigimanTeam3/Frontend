import { http, HttpResponse } from 'msw/http'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import type { UploadedImage } from '@/shared/types/upload'

// Image upload mock (C8). Shape follows POST /uploads/images of the backend API spec, in camelCase.

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const uploadHandlers = [
  http.post('/api/uploads/images', async ({ request }) => {
    await mockDelay(800)
    if (currentUserId(request) === null) return unauthorizedResponse()

    const file = (await request.formData()).get('file')
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse(400, 'EMPTY_FILE', 'file is empty')
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(400, 'UNSUPPORTED_IMAGE_TYPE', `${file.type} is not supported`)
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse(413, 'FILE_TOO_LARGE', 'file is larger than 10MB')
    }

    // The mock keeps the photo in this tab only: a blob URL shows the picked photo until a reload.
    const body: UploadedImage = {
      url: URL.createObjectURL(file),
      contentType: file.type,
      size: file.size,
    }
    return HttpResponse.json(body, { status: 201 })
  }),
]
