import { useId, useState } from 'react'
import { CardThumbnail } from '@/features/mypage/components/CardThumbnail'
import { SectionHead } from '@/features/mypage/components/SectionHead'
import { SectionError, SectionLoading } from '@/features/mypage/components/SectionStatus'
import { useMyCardsQuery } from '@/shared/api/cards'
import { ja } from '@/shared/i18n/ja'

// How many cards show before the "show all" button.
const COLLAPSED_COUNT = 4

// My experience cards as a grid of small polaroids; more than four are folded away.
export function CardSection() {
  const { cards: copy } = ja.myPage
  const { data, isPending, isError, refetch } = useMyCardsQuery()
  const [expanded, setExpanded] = useState(false)
  const gridId = useId()

  const cards = data?.items ?? []
  const visible = expanded ? cards : cards.slice(0, COLLAPSED_COUNT)

  return (
    <section className="flex flex-col gap-6">
      <SectionHead
        title={copy.title}
        trailing={
          cards.length > COLLAPSED_COUNT && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={gridId}
              onClick={() => setExpanded(!expanded)}
              className="-my-2 px-1 py-2 text-[13px] leading-[1.6] text-ink-muted"
            >
              {expanded ? copy.showLess : copy.showAll}
            </button>
          )
        }
      />
      {isPending && (
        <SectionLoading>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((item) => (
              <div key={item} className="aspect-[270/430] rounded-md bg-ink/5" />
            ))}
          </div>
        </SectionLoading>
      )}
      {isError && <SectionError onRetry={() => void refetch()} />}
      {data && cards.length === 0 && (
        <div className="flex flex-col items-center gap-1 rounded-[14px] border border-dashed border-line px-4 py-8 text-center">
          <p className="text-[15px] leading-normal font-bold text-ink">{copy.empty.title}</p>
          <p className="text-[13px] leading-[1.6] text-ink-muted">{copy.empty.body}</p>
        </div>
      )}
      {cards.length > 0 && (
        <ul id={gridId} className="grid grid-cols-2 gap-x-4 gap-y-5">
          {visible.map((card) => (
            <li key={card.id} className="min-w-0">
              <CardThumbnail card={card} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
