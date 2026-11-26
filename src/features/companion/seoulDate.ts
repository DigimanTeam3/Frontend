// Date helpers in Seoul time (events and meeting times are always KST, +09:00).

const seoulDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Seoul calendar day as "YYYY-MM-DD". */
export function seoulDay(date: Date | string) {
  return seoulDayFormatter.format(typeof date === 'string' ? new Date(date) : date)
}

/** "2026-12-06" + "18:00" → "2026-12-06T18:00:00+09:00". */
export function toSeoulIso(day: string, time: string) {
  return `${day}T${time}:00+09:00`
}

/** "08:00", "08:30", … "22:00". */
export function meetingTimeOptions(firstHour = 8, lastHour = 22) {
  const options: string[] = []
  for (let hour = firstHour; hour <= lastHour; hour += 1) {
    const hh = String(hour).padStart(2, '0')
    options.push(`${hh}:00`)
    if (hour < lastHour) options.push(`${hh}:30`)
  }
  return options
}
