import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { CardInfo } from '@/features/card/components/CardInfo'
import { CardStickers } from '@/features/card/components/CardStickers'
import { detailStickers } from '@/features/card/stickers'
import { useStickerStore } from '@/features/card/stickerStore'
import { ja } from '@/shared/i18n/ja'
import { polaroidCardText } from '@/shared/lib/polaroidCardText'
import type { ExperienceCard } from '@/shared/types/card'
import { buttonClassName } from '@/shared/ui/buttonStyles'
import { PolaroidCard } from '@/shared/ui/PolaroidCard'
import { Toast } from '@/shared/ui/Toast'

export interface CardDetailProps {
  card: ExperienceCard
}

// Figma S14 draws the action buttons 54px high with 16px text. The `!` makes these win over the
// shared 52px / 15px size classes whatever their order in the stylesheet.
const ACTION_SIZE = 'h-[54px]! flex-1 text-base!'

// The loaded screen (Figma: S14 カード詳細): the saved card with its badge stickers, the info
// list with the memo, and the actions.
export function CardDetail({ card }: CardDetailProps) {
  const { cardDetail: copy } = ja
  // What was arranged on the completion screen in this session, else the Figma places.
  const stickers = detailStickers(useStickerStore((state) => state.placementsByCard[card.id]))
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)

  const closeEditor = () => {
    // Rendered at once: the edit button is back by this, so the focus returns to it.
    flushSync(() => setEditing(false))
    editButton.current?.focus({ preventScroll: true })
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">{copy.title}</h1>

      {/* Stretched over the 24px page padding and clipped there: a sticker arranged at the very
          edge of the card would reach past the screen and make the page scroll sideways. */}
      <div className="-mx-6 overflow-x-clip px-6 pt-6">
        <div className="mx-auto w-full max-w-[310px]">
          <PolaroidCard {...polaroidCardText(card)}>
            <CardStickers stickers={stickers} />
          </PolaroidCard>
        </div>
      </div>

      <div className="mt-7">
        <CardInfo
          card={card}
          editing={editing}
          onMemoSaved={() => {
            closeEditor()
            setToast(copy.memoSaved)
          }}
          onEditCancel={closeEditor}
        />
      </div>

      {/* The editor has its own buttons. */}
      {!editing && (
        <div className="mt-auto flex gap-2.5 pt-[26px]">
          <button
            type="button"
            ref={editButton}
            onClick={() => setEditing(true)}
            className={`${buttonClassName({ variant: 'accentOutline', shape: 'pill' })} ${ACTION_SIZE}`}
          >
            {copy.editMemo}
          </button>
        </div>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
