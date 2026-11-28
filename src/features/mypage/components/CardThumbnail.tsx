import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import { detailStickers, fromSavedPlacements } from '@/shared/lib/stickers'
import { useStickerStore } from '@/shared/stores/stickerStore'
import type { ExperienceCard } from '@/shared/types/card'
import { CardStickers } from '@/shared/ui/CardStickers'
import { PolaroidCard } from '@/shared/ui/PolaroidCard'

export interface CardThumbnailProps {
  card: ExperienceCard
}

// A small polaroid that links to the card. It shows the stickers as arranged in this session,
// else as the card keeps them, else at the default places of the card detail, like S14.
export function CardThumbnail({ card }: CardThumbnailProps) {
  const arranged = useStickerStore((state) => state.placementsByCard[card.id])
  const stickers = detailStickers(arranged ?? fromSavedPlacements(card.stickerPlacements))

  return (
    <Link
      to={paths.cardDetail(card.id)}
      aria-label={ja.myPage.cards.cardName(polaroidCardText(card).title)}
      className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gate"
    >
      <PolaroidCard {...polaroidCardText(card)}>
        <CardStickers stickers={stickers} />
      </PolaroidCard>
    </Link>
  )
}
