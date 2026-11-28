import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { useUploadImageMutation } from '@/shared/api/uploadImage'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/api/errors'
import { isNetworkError } from '@/shared/lib/apiError'
import type { UploadedImage } from '@/shared/types/upload'
import { CameraIcon } from '@/shared/ui/icons/CameraIcon'
import { CloseIcon } from '@/shared/ui/icons/CloseIcon'

export interface ImageUploaderProps {
  /** The uploaded photo, or null when there is none. */
  value: UploadedImage | null
  onChange: (image: UploadedImage | null) => void
  /** Tells the screen an upload is running, so it can hold its submit button. */
  onBusyChange?: (busy: boolean) => void
  disabled?: boolean
}

type ErrorKey = keyof typeof ja.imageUploader.errors

function errorKeyOf(error: unknown): ErrorKey {
  if (isNetworkError(error)) return 'NETWORK'
  const code = apiErrorCode(error)
  return code !== null && code in ja.imageUploader.errors ? (code as ErrorKey) : 'UNKNOWN'
}

// One photo: pick from the camera or the album -> shrink -> preview -> upload (Figma: ui / ImageUploader, C8).
// The phone's own picker offers "take photo" and "photo library", so there is a single button here.
export function ImageUploader({
  value,
  onChange,
  onBusyChange,
  disabled = false,
}: ImageUploaderProps) {
  const inputId = useId()
  const errorId = useId()
  const upload = useUploadImageMutation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)
  // Only the newest pick may report back. Removing the photo also cancels a running upload's result.
  const pickRef = useRef(0)
  const onBusyChangeRef = useRef(onBusyChange)
  useEffect(() => {
    onBusyChangeRef.current = onBusyChange
  })

  const isUploading = upload.isPending
  useEffect(() => {
    onBusyChangeRef.current?.(isUploading)
  }, [isUploading])

  // Free the local preview when it is replaced or the screen closes.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handlePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Clear the input so picking the same file again fires a change event.
    event.target.value = ''
    if (!file) return

    const pick = ++pickRef.current
    setErrorKey(null)
    // Some Android pickers hand over real photos with an empty type, so only a type that is set
    // and is not an image is refused here.
    if (file.type !== '' && !file.type.startsWith('image/')) {
      setErrorKey('UNSUPPORTED_IMAGE_TYPE')
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
    try {
      const image = await upload.mutateAsync(file)
      if (pick === pickRef.current) onChange(image)
    } catch (error) {
      if (pick !== pickRef.current) return
      setPreviewUrl(null)
      setErrorKey(errorKeyOf(error))
    }
  }

  const handleRemove = () => {
    pickRef.current++
    upload.reset()
    setPreviewUrl(null)
    setErrorKey(null)
    onChange(null)
  }

  const shownUrl = previewUrl ?? value?.url ?? null

  return (
    <div className="flex flex-col gap-2">
      {shownUrl ? (
        <div className="relative size-[104px] overflow-hidden rounded-[14px] bg-ink/5">
          <img
            src={shownUrl}
            alt={ja.imageUploader.previewAlt}
            className={`size-full object-cover ${isUploading ? 'opacity-50' : ''}`}
          />
          {isUploading && (
            <p
              role="status"
              className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[11px] leading-normal text-white"
            >
              {ja.imageUploader.uploading}
            </p>
          )}
          {/* 36px touch target around the 24px round button. */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={ja.imageUploader.remove}
            className="absolute top-0 right-0 flex size-9 items-center justify-center disabled:opacity-40"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-ink text-white">
              <CloseIcon />
            </span>
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex size-[104px] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-ink-muted/60 bg-surface text-ink-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
            disabled ? 'opacity-40' : 'cursor-pointer active:bg-ink/5'
          }`}
        >
          <CameraIcon />
          <span className="text-xs leading-normal">{ja.imageUploader.add}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={handlePick}
            aria-describedby={errorKey ? errorId : undefined}
            className="sr-only"
          />
        </label>
      )}
      {errorKey && (
        <p id={errorId} role="alert" className="text-xs leading-normal text-danger">
          {ja.imageUploader.errors[errorKey]}
        </p>
      )}
    </div>
  )
}
