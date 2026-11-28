export { categoryLabel, preferJa } from '@/shared/lib/eventText'

export type EventStatus = 'upcoming' | 'ongoing' | 'ended'

export function eventStatus(startIso: string, endIso: string, now = new Date()): EventStatus {
  if (now < new Date(startIso)) return 'upcoming'
  if (now > new Date(endIso)) return 'ended'
  return 'ongoing'
}
