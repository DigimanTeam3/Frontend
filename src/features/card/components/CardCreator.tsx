import { useNavigate } from 'react-router'
import { StickerLayer } from '@/features/card/components/StickerLayer'
import { StickerTray } from '@/features/card/components/StickerTray'
import { defaultPlacements } from '@/features/card/stickers'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import type { ExperienceCard } from '@/shared/types/card'
import { Button } from '@/shared/ui/Button'
import { PolaroidCard } from '@/shared/ui/PolaroidCard'

export interface CardCreatorProps {
  card: ExperienceCard
}

// The loaded screen (Figma: S13 カード生成): heading, the new card with its badge stickers, the
// sticker tray and the save button.
export function CardCreator({ card }: CardCreatorProps) {
  const navigate = useNavigate()
  const { complete: copy } = ja
  const placements = defaultPlacements()

  return (
    <>
      <div className="mt-4 flex flex-col items-center gap-0.5 text-center">
        <h1 className="text-[26px] leading-[1.4] font-bold text-ink">{copy.title}</h1>
        <p className="text-gate text-[13px] leading-normal font-medium">{copy.subtitle}</p>
      </div>

      {/* Figma stage: the card is 283.5px of the 342px content width. The margin beside it is
          the room for stickers that hang over the edge. */}
      <div className="mx-auto mt-6 w-[82.9%] max-w-[283.5px]">
        <PolaroidCard {...polaroidCardText(card)}>
          <StickerLayer placements={placements} />
        </PolaroidCard>
      </div>

      <div className="mt-auto flex flex-col gap-6 pt-6">
        <StickerTray />
        <Button
          variant="accent"
          shape="pill"
          fullWidth
          onClick={() => navigate(paths.cardDetail(card.id), { replace: true })}
        >
          {copy.save}
        </Button>
      </div>
    </>
  )
}
