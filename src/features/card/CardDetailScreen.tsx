import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCardQuery } from '@/features/card/api'
import { CardDetail } from '@/features/card/components/CardDetail'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/lib/apiError'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// S14 experience card detail (/cards/:cardId): a saved card with its badge stickers, the memo
// and the share action. Reached from the completion screen (S13) and from My Page.
export function CardDetailScreen() {
  const navigate = useNavigate()
  const cardId = parseIdParam(useParams().cardId)
  const cardQuery = useCardQuery(cardId)
  const { cardDetail: copy } = ja

  // The states without the card have no content of their own under the heading.
  const heading = <h1 className="sr-only">{copy.title}</h1>
  let content: ReactNode
  if (cardQuery.data) {
    // Checked before the error states: a failed background refetch must not close a card that
    // is already on screen.
    content = <CardDetail key={cardQuery.data.id} card={cardQuery.data} />
  } else if (cardId === null || apiErrorCode(cardQuery.error) === 'CARD_NOT_FOUND') {
    content = (
      <>
        {heading}
        <State
          kind="error"
          className="my-auto"
          icon={<SearchIcon />}
          title={copy.notFound.title}
          body={copy.notFound.body}
          action={{ label: copy.notFound.action, onClick: () => navigate(paths.me()) }}
        />
      </>
    )
  } else if (cardQuery.isError) {
    content = (
      <>
        {heading}
        <State kind="error" className="my-auto" onRetry={() => void cardQuery.refetch()} />
      </>
    )
  } else {
    content = (
      <>
        {heading}
        <State kind="loading" />
      </>
    )
  }

  return <section className="flex flex-1 flex-col">{content}</section>
}
