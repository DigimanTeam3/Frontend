import { ja } from '@/shared/i18n/ja'
import type { ExperienceCard } from '@/shared/types/card'

/**
 * What the polaroid prints for an experience card: spread it into <PolaroidCard>.
 * The photo is my own one when I added it, else the event picture.
 */
export function polaroidCardText(card: ExperienceCard) {
  // eventDate is the Seoul day of the check-in as ISO 8601 ("2026-11-26T00:00:00+09:00"): its
  // first ten characters are that day, no time zone math needed. A card without it shows the day
  // it was made.
  const [year = '', month = '', day = ''] = (card.eventDate ?? card.createdAt)
    .slice(0, 10)
    .split('-')
  const titleJa = card.event?.titleJa ?? card.eventTitleJa ?? null
  return {
    photoUrl: card.userImage ?? card.eventImage,
    title: titleJa ?? card.event?.title ?? card.eventTitle ?? '',
    titleLang: titleJa === null ? ('ko' as const) : undefined,
    dateText: ja.polaroidCard.date(year, month, day),
    venueText: card.venueJa ?? card.venue,
    venueLang: card.venueJa === null ? ('ko' as const) : undefined,
    numberText: ja.polaroidCard.number(card.id),
  }
}
