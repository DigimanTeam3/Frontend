/** Answer of POST /api/uploads/images. `url` goes into the image field of another API. */
export interface UploadedImage {
  url: string
  contentType: string
  /** Bytes stored by the server. */
  size: number
}
