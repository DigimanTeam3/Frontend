import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router'
import { CardInfo } from '@/features/card/components/CardInfo'
import { ShareImagePreview } from '@/features/card/components/ShareImagePreview'
import { CardStickers } from '@/shared/ui/CardStickers'
import { detailStickers, fromSavedPlacements } from '@/shared/lib/stickers'
import { useStickerStore } from '@/shared/stores/stickerStore'
import { useShareCard } from '@/features/card/useShareCard'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
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
// list with the memo (edited with the pencil in its row), and the actions: home and share.
export function CardDetail({ card }: CardDetailProps) {
  const { cardDetail: copy } = ja
  // What was arranged on the completion screen in this session, else what the card keeps, else
  // the Figma places.
  const arranged = useStickerStore((state) => state.placementsByCard[card.id])
  const stickers = detailStickers(arranged ?? fromSavedPlacements(card.stickerPlacements))
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const shareButton = useRef<HTMLButtonElement>(null)
  const { share, preparing, previewUrl, closePreview } = useShareCard(card, stickers, setToast)

  const closeEditor = () => {
    // Rendered at once: the edit button is back by this, so the focus returns to it.
    flushSync(() => setEditing(false))
    editButton.current?.focus({ preventScroll: true })
  }

  const closeSharePreview = () => {
    // Back to the button that opened the overlay.
    flushSync(closePreview)
    shareButton.current?.focus({ preventScroll: true })
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">{copy.title}</h1>

      {/* Stretched over the page padding and clipped there: a sticker arranged at the very edge
          of the card would reach past the screen and make the page scroll sideways. The padding
          is the layout's gutter token, or the 16px of the layout that has no token yet. */}
      <div className="-mx-[var(--spacing-gutter,16px)] overflow-x-clip px-[var(--spacing-gutter,16px)] pt-6">
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
          onEdit={() => setEditing(true)}
          editButtonRef={editButton}
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
          <Link
            to={paths.home()}
            className={`${buttonClassName({ variant: 'accentOutline', shape: 'pill' })} ${ACTION_SIZE}`}
          >
            {copy.toHome}
          </Link>
          {/* A plain button with the shared look: it needs the ref. */}
          <button
            type="button"
            ref={shareButton}
            onClick={share}
            disabled={preparing}
            aria-busy={preparing}
            className={`${buttonClassName({ variant: 'accent', shape: 'pill' })} ${ACTION_SIZE}`}
          >
            {preparing ? copy.sharePreparing : copy.share}
          </button>
        </div>
      )}

      {previewUrl && <ShareImagePreview imageUrl={previewUrl} onClose={closeSharePreview} />}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
