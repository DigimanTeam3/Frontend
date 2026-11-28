import { useEffect, type ReactNode } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { useCardQuery } from '@/features/card/api'
import { CardDetail } from '@/features/card/components/CardDetail'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/api/errors'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// How long to wait for the router to put the address back after a blocked step (a history move
// that ends with a popstate event). Only used when that event was missed.
const RESTORE_WAIT_MS = 200

/**
 * Right after a card is made (router state `justMade` from S13), the screens behind this one are
 * the finished missions. Going back there is a dead end, so a step back (the top bar button, the
 * browser or the phone's back button) leads home instead. Opened from My Page, back is untouched.
 */
function useBackLeadsHome(active: boolean) {
  const navigate = useNavigate()
  const blocker = useBlocker(({ historyAction }) => active && historyAction === 'POP')

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let done = false
    const goHome = () => {
      if (done) return
      done = true
      blocker.reset()
      void navigate(paths.home(), { replace: true })
    }
    // The router is still moving the history back to this screen. Replacing before that ends
    // would write on the wrong entry, so wait for the move (its popstate), or for the timer.
    window.addEventListener('popstate', goHome, { once: true })
    const timer = window.setTimeout(goHome, RESTORE_WAIT_MS)
    return () => {
      window.removeEventListener('popstate', goHome)
      window.clearTimeout(timer)
    }
  }, [blocker, navigate])
}

// S14 experience card detail (/cards/:cardId): a saved card with its badge stickers, the memo
// and the share action. Reached from the completion screen (S13) and from My Page.
export function CardDetailScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  useBackLeadsHome((location.state as { justMade?: unknown } | null)?.justMade === true)
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
  } else if (
    cardId === null ||
    // FORBIDDEN: the card belongs to another user. Retrying cannot help, so it reads as not found.
    ['CARD_NOT_FOUND', 'FORBIDDEN'].includes(apiErrorCode(cardQuery.error) ?? '')
  ) {
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
