const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
})

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function formatDateRange(startIso: string, endIso: string) {
  const start = formatDate(startIso)
  const end = formatDate(endIso)
  return start === end ? start : `${start} 〜 ${end}`
}
