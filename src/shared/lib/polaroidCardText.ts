import { ja } from '@/shared/i18n/ja'
import type { ExperienceCard } from '@/shared/types/card'

/**
 * What the polaroid prints for an experience card: spread it into <PolaroidCard>.
 * The photo is my own one when I added it, else the event picture.
 */
export function polaroidCardText(card: ExperienceCard) {
  // eventDate is "YYYY-MM-DD" (Seoul day of the check-in): no time zone math needed.
  const [year = '', month = '', day = ''] = card.eventDate.split('-')
  return {
    photoUrl: card.userImage ?? card.eventImage,
    title: card.event.titleJa ?? card.event.title,
    titleLang: card.event.titleJa === null ? ('ko' as const) : undefined,
    dateText: ja.polaroidCard.date(year, month, day),
    venueText: card.venueJa ?? card.venue,
    venueLang: card.venueJa === null ? ('ko' as const) : undefined,
    numberText: ja.polaroidCard.number(card.id),
  }
}
