import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CardCreator } from '@/features/card/components/CardCreator'
import { useMyCardsQuery } from '@/shared/api/cards'
import { useJourneyEventQuery } from '@/shared/api/journey'
import { ja } from '@/shared/i18n/ja'
import { isEventNotFound } from '@/shared/lib/apiError'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { EventNotFoundState } from '@/shared/ui/EventNotFoundState'
import { FlagIcon } from '@/shared/ui/icons/FlagIcon'
import { State } from '@/shared/ui/State'

// S13 completion badge and card creation (/events/:eventId/complete): reached right after the
// last required mission (S12), and also on a reload or a direct visit, so it reads from the API.
export function CompleteScreen() {
  const navigate = useNavigate()
  const eventId = parseIdParam(useParams().eventId)
  // The event is only read to tell an unknown event from "no card yet".
  const eventQuery = useJourneyEventQuery(eventId)
  const cardsQuery = useMyCardsQuery(eventId !== null)
  const card = cardsQuery.data?.items.find((item) => item.eventId === eventId)
  // A list kept from before this visit may be older than the card: while its first refetch
  // runs, "no card yet" is not known, so the screen waits instead of showing the empty state.
  const cardsChecking = cardsQuery.isFetching && !cardsQuery.isFetchedAfterMount

  // Every state but the card itself has no visible heading.
  const heading = <h1 className="sr-only">{ja.complete.screenName}</h1>
  let content: ReactNode
  if (card) {
    // Checked before the error states: a failed background refetch must not close a card that
    // is already on screen.
    content = <CardCreator key={card.id} card={card} />
  } else if (eventId === null || isEventNotFound(eventQuery.error)) {
    content = (
      <>
        {heading}
        <EventNotFoundState />
      </>
    )
  } else if (eventQuery.isError || cardsQuery.isError) {
    content = (
      <>
        {heading}
        <State
          kind="error"
          className="my-auto"
          onRetry={() => {
            if (eventQuery.isError) void eventQuery.refetch()
            if (cardsQuery.isError) void cardsQuery.refetch()
          }}
        />
      </>
    )
  } else if (eventQuery.data && cardsQuery.data && !cardsChecking) {
    // The card and the complete badge only exist after every required mission is done.
    const { noCard } = ja.complete
    content = (
      <>
        {heading}
        <State
          kind="empty"
          className="my-auto"
          // The 20px line icon drawn at 28px: a thinner stroke keeps the same line weight.
          icon={<FlagIcon className="size-7" strokeWidth={1.3} />}
          title={noCard.title}
          body={noCard.body}
          action={{ label: noCard.action, onClick: () => navigate(paths.missions(eventId)) }}
        />
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
