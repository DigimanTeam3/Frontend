import { ja } from '@/shared/i18n/ja'
import type { ConciergeConditions } from '@/shared/types/concierge'

const monthDay = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
})

/** 「11.29」 printed on the ticket, Seoul time. */
function ticketDay(iso: string) {
  const parts = monthDay.formatToParts(new Date(iso))
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${month}.${day}`
}

/** 「11.01 — 11.30」, or one day when start and end are the same day. */
export function ticketPeriod(startIso: string, endIso: string) {
  const start = ticketDay(startIso)
  const end = ticketDay(endIso)
  return start === end ? start : `${start} — ${end}`
}

/** 「No.0001」 style serial printed on tickets and request slips. */
export function serial(value: number) {
  return `No.${String(value).padStart(4, '0')}`
}

// 「2026-11-28」 → 「11/28」
const shortDate = (date: string) => {
  const [, month, day] = date.split('-')
  return month && day ? `${Number(month)}/${Number(day)}` : date
}

/** Human-readable parts of the search conditions, e.g. ["11/28〜11/29", "一人で"]. */
export function conditionLabels(conditions: ConciergeConditions) {
  const labels: string[] = []
  const { dateFrom, dateTo } = conditions
  if (dateFrom && dateTo && dateFrom !== dateTo) {
    labels.push(`${shortDate(dateFrom)}〜${shortDate(dateTo)}`)
  } else if (dateFrom || dateTo) {
    labels.push(shortDate((dateFrom ?? dateTo) as string))
  }
  if (conditions.area) labels.push(conditions.area)
  if (conditions.category) labels.push(ja.concierge.conditions.category[conditions.category])
  if (conditions.companion) labels.push(ja.concierge.conditions[conditions.companion])
  labels.push(...conditions.keywords)
  return labels
}
