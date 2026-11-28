import { seoulDay, toSeoulIso } from '@/features/companion/seoulDate'
import { ja } from '@/shared/i18n/ja'
import type { EventSummary } from '@/shared/types/companion'

export const MIN_CAPACITY = 2
export const MAX_CAPACITY = 4
export const INTRO_MAX_LENGTH = 60

// Contact details are not allowed in posts: meet at the venue and talk in person.
const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[\w-]+\.(com|net|jp|kr|me|io|ly)\b/i
// Separators: ASCII hyphen, spaces, dots, Unicode dashes, minus, ー and full-width hyphen.
const PHONE_PATTERN = /\d{2,4}[-\s.‐‑–—−ー－]?\d{3,4}[-\s.‐‑–—−ー－]?\d{4}/

/** NFKC first so full-width digits and letters (０９０, ｗｗｗ) are caught too. Shared with the mock. */
export function hasContactInfo(intro: string) {
  const normalized = intro.normalize('NFKC')
  return URL_PATTERN.test(normalized) || PHONE_PATTERN.test(normalized)
}

export interface CompanionFormValues {
  day: string
  time: string
  capacity: number
  intro: string
}

export type CompanionFormErrors = Partial<Record<keyof CompanionFormValues, string>>

/** Counts characters the way people see them (emoji and kana count as one). */
export function introLength(intro: string) {
  return Array.from(intro.trim()).length
}

/** Days a meeting can be set: from today (or the event start) to the event end. */
export function selectableDayRange(event: EventSummary, now = new Date()) {
  const today = seoulDay(now)
  const start = seoulDay(event.startDate)
  return { min: start > today ? start : today, max: seoulDay(event.endDate) }
}

export function validateCompanionForm(
  values: CompanionFormValues,
  event: EventSummary,
  now = new Date(),
): CompanionFormErrors {
  const errors: CompanionFormErrors = {}
  const messages = ja.companionNew.errors
  const { min, max } = selectableDayRange(event, now)

  if (!values.day) errors.day = messages.dateRequired
  else if (values.day < min || values.day > max) errors.day = messages.dateOutOfRange

  if (!/^\d{2}:(00|30)$/.test(values.time)) errors.time = messages.timeRequired
  else if (!errors.day) {
    const meetAt = new Date(toSeoulIso(values.day, values.time))
    if (meetAt <= now) errors.time = messages.timePast
    else if (meetAt > new Date(event.endDate)) errors.time = messages.timeAfterEnd
  }

  if (
    !Number.isInteger(values.capacity) ||
    values.capacity < MIN_CAPACITY ||
    values.capacity > MAX_CAPACITY
  ) {
    errors.capacity = messages.capacity
  }

  const intro = values.intro.trim()
  if (!intro) errors.intro = messages.introRequired
  else if (introLength(intro) > INTRO_MAX_LENGTH)
    errors.intro = messages.introTooLong(INTRO_MAX_LENGTH)
  else if (hasContactInfo(intro)) errors.intro = messages.contactInfo

  return errors
}
