import { ja } from '@/shared/i18n/ja'

const meetAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "2026-12-06T18:00:00+09:00" → "12/6（土）18:00" (Seoul time). */
export function formatMeetAt(iso: string) {
  const parts = Object.fromEntries(
    meetAtFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return ja.companion.meetAt(parts.month, parts.day, parts.weekday, `${parts.hour}:${parts.minute}`)
}
