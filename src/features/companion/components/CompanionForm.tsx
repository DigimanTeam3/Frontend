import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCreateCompanionMutation } from '@/features/companion/api'
import { EventStrip } from '@/features/companion/components/EventStrip'
import { meetingTimeOptions, toSeoulIso } from '@/features/companion/seoulDate'
import {
  INTRO_MAX_LENGTH,
  MAX_CAPACITY,
  MIN_CAPACITY,
  introLength,
  selectableDayRange,
  validateCompanionForm,
  type CompanionFormErrors,
  type CompanionFormValues,
} from '@/features/companion/validation'
import { apiErrorCode, apiErrorField } from '@/shared/api/errors'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/companion'

const TIME_OPTIONS = meetingTimeOptions()
const FIELD_ORDER: (keyof CompanionFormValues)[] = ['day', 'time', 'capacity', 'intro']
const text = ja.companionNew

export interface CompanionFormProps {
  event: EventSummary
  /** The user's open post for this event, if any (one open post per event). */
  myOpenPostId: number | null
}

const fieldBox =
  'w-full rounded-xl border bg-surface px-4 py-3 text-base outline-none focus:border-primary'

export function CompanionForm({ event, myOpenPostId }: CompanionFormProps) {
  const navigate = useNavigate()
  const mutation = useCreateCompanionMutation(event.id)
  const range = selectableDayRange(event)
  const eventEnded = range.min > range.max

  const [values, setValues] = useState<CompanionFormValues>({
    day: eventEnded ? '' : range.min,
    time: '',
    capacity: MIN_CAPACITY,
    intro: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<CompanionFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  // Client checks win; server errors stay until that field is edited (cleared keys are undefined).
  const errors: CompanionFormErrors = {
    ...serverErrors,
    ...(submitted ? validateCompanionForm(values, event) : {}),
  }
  const blocked = eventEnded || myOpenPostId !== null

  const update = <K extends keyof CompanionFormValues>(key: K, value: CompanionFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setServerErrors((current) => ({ ...current, [key]: undefined }))
    setFormError(null)
  }

  // 401 needs nothing here: apiClient logs out and RequireAuth sends the user to login.
  const showServerError = (error: unknown) => {
    switch (apiErrorCode(error)) {
      case 'CONTACT_INFO_NOT_ALLOWED':
        setServerErrors({ intro: text.errors.contactInfo })
        return
      case 'VALIDATION_ERROR': {
        const field = apiErrorField(error)
        if (field === 'meetAt') setServerErrors({ day: text.errors.dateOutOfRange })
        else if (field === 'capacity') setServerErrors({ capacity: text.errors.capacity })
        else if (field === 'intro')
          setServerErrors({ intro: text.errors.introTooLong(INTRO_MAX_LENGTH) })
        else setFormError(ja.common.error)
        return
      }
      case 'ALREADY_POSTED':
        setFormError(text.alreadyPosted)
        return
      case 'EVENT_ENDED':
        setFormError(text.eventEnded)
        return
      default:
        setFormError(ja.common.error)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blocked || mutation.isPending) return
    setSubmitted(true)
    const found = validateCompanionForm(values, event)
    const firstInvalid = FIELD_ORDER.find((key) => found[key])
    if (firstInvalid) {
      document.getElementById(`companion-${firstInvalid}`)?.focus()
      return
    }
    mutation.mutate(
      {
        meetAt: toSeoulIso(values.day, values.time),
        capacity: values.capacity,
        intro: values.intro.trim(),
      },
      {
        onSuccess: (post) => navigate(`/companions/${post.id}`, { replace: true }),
        onError: showServerError,
      },
    )
  }

  const borderFor = (key: keyof CompanionFormValues) =>
    errors[key] ? 'border-danger' : 'border-line'
  const count = introLength(values.intro)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <EventStrip event={event} label={text.eventLabel} />

      {blocked && (
        <div role="status" className="rounded-xl border border-line bg-ink/5 p-4 text-sm">
          <p>{eventEnded ? text.eventEnded : text.alreadyPosted}</p>
          {myOpenPostId !== null && (
            <Link
              to={`/companions/${myOpenPostId}`}
              className="mt-2 inline-block text-primary underline"
            >
              {ja.companion.viewMine}
            </Link>
          )}
        </div>
      )}

      <fieldset disabled={blocked} className="flex flex-col gap-5 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-3">
          <Field id="companion-day" label={text.date} error={errors.day}>
            <input
              id="companion-day"
              type="date"
              required
              min={range.min}
              max={range.max}
              value={values.day}
              onChange={(e) => update('day', e.target.value)}
              aria-invalid={Boolean(errors.day)}
              aria-describedby={errors.day ? 'companion-day-error' : undefined}
              className={`${fieldBox} ${borderFor('day')}`}
            />
          </Field>
          <Field id="companion-time" label={text.time} error={errors.time}>
            <select
              id="companion-time"
              required
              value={values.time}
              onChange={(e) => update('time', e.target.value)}
              aria-invalid={Boolean(errors.time)}
              aria-describedby={errors.time ? 'companion-time-error' : undefined}
              className={`${fieldBox} ${borderFor('time')}`}
            >
              <option value="">{text.timePlaceholder}</option>
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">{text.place}</p>
          <p className="rounded-xl border border-dashed border-line px-4 py-3">
            {event.venueNameJa ?? event.venueName}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{text.placeNote}</p>
        </div>

        <Field id="companion-capacity" label={text.capacity} error={errors.capacity}>
          <div
            id="companion-capacity"
            tabIndex={-1}
            className={`inline-flex items-center rounded-xl border bg-surface ${borderFor('capacity')}`}
          >
            <button
              type="button"
              aria-label={text.capacityDecrease}
              disabled={values.capacity <= MIN_CAPACITY}
              onClick={() => update('capacity', values.capacity - 1)}
              className="px-5 py-3 text-xl text-primary disabled:text-ink-muted/40"
            >
              −
            </button>
            <output aria-live="polite" className="w-16 text-center font-bold">
              {text.people(values.capacity)}
            </output>
            <button
              type="button"
              aria-label={text.capacityIncrease}
              disabled={values.capacity >= MAX_CAPACITY}
              onClick={() => update('capacity', values.capacity + 1)}
              className="px-5 py-3 text-xl text-primary disabled:text-ink-muted/40"
            >
              ＋
            </button>
          </div>
        </Field>

        <Field id="companion-intro" label={text.intro} error={errors.intro}>
          <input
            id="companion-intro"
            type="text"
            required
            autoComplete="off"
            enterKeyHint="done"
            placeholder={text.introPlaceholder}
            value={values.intro}
            onChange={(e) => update('intro', e.target.value)}
            aria-invalid={Boolean(errors.intro)}
            aria-describedby={`companion-intro-count${errors.intro ? ' companion-intro-error' : ''}`}
            className={`${fieldBox} ${borderFor('intro')}`}
          />
          <p
            id="companion-intro-count"
            className={`mt-1 text-right text-xs ${count > INTRO_MAX_LENGTH ? 'text-danger' : 'text-ink-muted'}`}
          >
            {text.introCount(count, INTRO_MAX_LENGTH)}
          </p>
        </Field>

        <aside className="rounded-xl bg-primary/5 p-4">
          <p className="font-bold">{text.safetyTitle}</p>
          <p className="mt-1 text-sm text-ink-muted">{text.safetyBody}</p>
        </aside>

        {/* The banner above already says why the form is blocked (e.g. after 409 ALREADY_POSTED). */}
        {formError && !blocked && (
          <p role="alert" className="text-center text-sm text-danger">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-2xl bg-primary py-4 font-bold text-surface disabled:opacity-60"
        >
          {mutation.isPending ? text.submitting : text.submit}
        </button>
      </fieldset>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
