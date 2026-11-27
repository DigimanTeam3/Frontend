import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSubmitMissionMutation } from '@/features/mission/api'
import { MissionHeader } from '@/features/mission/components/MissionHeader'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/lib/apiError'
import { paths } from '@/shared/lib/paths'
import type { Mission, SubmissionRequest } from '@/shared/types/mission'
import type { UploadedImage } from '@/shared/types/upload'
import { Button } from '@/shared/ui/Button'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { AlertIcon } from '@/shared/ui/icons/AlertIcon'
import { ImageUploader } from '@/shared/ui/ImageUploader'

export interface MissionSubmitFormProps {
  mission: Mission
  /** Place of the mission in the event's list, starting at 1. */
  position: number
  /** The server answered 404 MISSION_NOT_FOUND to the submission. */
  onMissionNotFound: () => void
}

// The counter shows text.length (UTF-16 units), which is what maxLength limits.
const TEXT_MAX_LENGTH = 200

const LABEL = 'text-xs leading-normal font-bold text-ink-muted'

type ErrorKey = keyof typeof ja.missionSubmit.errors

function errorKeyOf(error: unknown): ErrorKey {
  const code = apiErrorCode(error)
  return code !== null && Object.hasOwn(ja.missionSubmit.errors, code)
    ? (code as ErrorKey)
    : 'UNKNOWN'
}

/** The request body, or null while the form is not complete. */
function submissionBody(
  mission: Mission,
  image: UploadedImage | null,
  text: string,
): SubmissionRequest | null {
  const trimmed = text.trim()
  if (mission.verificationMethod === 'text') return trimmed === '' ? null : { text: trimmed }
  if (!image) return null
  return trimmed === '' ? { image: image.url } : { image: image.url, text: trimmed }
}

// The form of a mission that is still open (Figma: S12 ミッション提出): one photo for a photo
// mission, the comment (required for a text mission), and the submit button.
export function MissionSubmitForm({
  mission,
  position,
  onMissionNotFound,
}: MissionSubmitFormProps) {
  const navigate = useNavigate()
  const { missionSubmit: copy } = ja
  const photoLabelId = useId()
  const textId = useId()
  const counterId = useId()
  const submit = useSubmitMissionMutation(mission.eventId)

  const [image, setImage] = useState<UploadedImage | null>(null)
  const [uploading, setUploading] = useState(false)
  // The uploader keeps its own preview; a new key is the way to empty it from here.
  const [uploaderKey, setUploaderKey] = useState(0)
  const [text, setText] = useState('')

  const isPhoto = mission.verificationMethod === 'photo'
  const body = submissionBody(mission, image, text)
  const submitting = submit.isPending
  const errorKey = submit.isError ? errorKeyOf(submit.error) : null
  // The message of the last try no longer fits once the input changes.
  const clearError = () => {
    if (submit.isError) submit.reset()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!body || uploading || submitting) return
    try {
      const result = await submit.mutateAsync({ missionId: mission.id, body })
      if (result.experienceCard) {
        // That was the last required mission: on to the completion screen.
        void navigate(paths.complete(mission.eventId), { replace: true })
      } else {
        void navigate(paths.missions(mission.eventId), {
          replace: true,
          state: { submitted: true },
        })
      }
    } catch (error) {
      // The message itself comes from submit.error; here only what the form has to do.
      const code = apiErrorCode(error)
      if (code === 'MISSION_NOT_FOUND') onMissionNotFound()
      if (code === 'INVALID_IMAGE_URL') {
        setImage(null)
        setUploaderKey((key) => key + 1)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-5">
      <MissionHeader mission={mission} position={position} />

      {isPhoto && (
        <div role="group" aria-labelledby={photoLabelId} className="flex flex-col gap-2">
          <p id={photoLabelId} className={LABEL}>
            {copy.photoLabel}
          </p>
          <ImageUploader
            key={uploaderKey}
            value={image}
            onChange={(next) => {
              setImage(next)
              clearError()
            }}
            onBusyChange={setUploading}
            disabled={submitting}
          />
          <p className="text-ink-faint text-xs leading-normal">{copy.photoHelp}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={textId} className={LABEL}>
          {copy.textLabel}
        </label>
        {/* 16px text (Figma: 15px): iOS Safari zooms the page when a focused field is smaller. */}
        <textarea
          id={textId}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            clearError()
          }}
          maxLength={TEXT_MAX_LENGTH}
          aria-required={!isPhoto}
          aria-describedby={counterId}
          readOnly={submitting}
          className="h-[120px] w-full resize-none rounded-[10px] border-[1.5px] border-line bg-surface px-3.5 py-3 text-base leading-[1.65] text-ink outline-none focus:border-ink"
        />
        <p id={counterId} className="text-ink-faint text-xs leading-normal">
          {copy.counter(text.length, TEXT_MAX_LENGTH)}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-1">
        {errorKey && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2.5 rounded-[10px] bg-danger/10 px-3.5 py-3"
          >
            <p className="flex items-start gap-2 text-[13px] leading-[1.6] text-ink">
              <AlertIcon className="size-5 shrink-0 text-danger" />
              <span className="min-w-0">{copy.errors[errorKey]}</span>
            </p>
            {errorKey === 'NOT_VERIFIED' && (
              <Link
                to={paths.checkIn(mission.eventId)}
                className={buttonClassName({ variant: 'outline', size: 'sm' })}
              >
                {copy.toCheckIn}
              </Link>
            )}
          </div>
        )}
        <Button
          type="submit"
          fullWidth
          disabled={!body || uploading || submitting}
          aria-busy={submitting}
        >
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  )
}
