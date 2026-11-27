import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BadgeEarned } from '@/features/badge/components/BadgeEarned'
import { useMyBadgesQuery } from '@/shared/api/badges'
import { useJourneyEventQuery, useParticipationQuery } from '@/shared/api/journey'
import { ja } from '@/shared/i18n/ja'
import { isEventNotFound } from '@/shared/lib/apiError'
import { isCheckedIn } from '@/shared/lib/participationStatus'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { PinIcon } from '@/shared/ui/icons/PinIcon'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// S10 participation badge (/events/:eventId/badge): reached right after the ticket is torn in
// S09, and also on a reload or a direct visit, so it reads everything from the API.
export function ParticipationBadgeScreen() {
  const navigate = useNavigate()
  const eventId = parseIdParam(useParams().eventId)
  const eventQuery = useJourneyEventQuery(eventId)
  const participationQuery = useParticipationQuery(eventId)

  const event = eventQuery.data
  const participation = participationQuery.data
  const verified = isCheckedIn(participation?.status)
  // The badge only gives the exact time; without it the participation has the same moment.
  const badgesQuery = useMyBadgesQuery('participation', verified)
  const badge = badgesQuery.data?.items.find((item) => item.eventId === eventId)

  // Every state but "earned" has no visible heading, so the screen name stays for screen readers.
  const heading = <h1 className="sr-only">{ja.participationBadge.title}</h1>
  let content: ReactNode
  if (event && participation !== undefined) {
    // Checked before the error states: a failed background refetch must not close a badge
    // that is already on screen.
    if (participation && verified) {
      content = badgesQuery.isLoading ? (
        <>
          {heading}
          <State kind="loading" />
        </>
      ) : (
        <BadgeEarned
          event={event}
          ticketNumber={participation.id}
          earnedAt={badge?.acquiredAt ?? participation.verifiedAt ?? participation.createdAt}
        />
      )
    } else {
      const { notVerified } = ja.participationBadge
      content = (
        <>
          {heading}
          <State
            kind="empty"
            className="my-auto"
            icon={<PinIcon />}
            title={notVerified.title}
            body={notVerified.body}
            action={{ label: notVerified.action, onClick: () => navigate(paths.checkIn(event.id)) }}
          />
        </>
      )
    }
  } else if (eventId === null || isEventNotFound(eventQuery.error)) {
    content = (
      <>
        {heading}
        <State
          kind="error"
          className="my-auto"
          icon={<SearchIcon />}
          title={ja.eventNotFound.title}
          body={ja.eventNotFound.body}
          action={{ label: ja.eventNotFound.home, onClick: () => navigate(paths.home()) }}
        />
      </>
    )
  } else if (eventQuery.isError || participationQuery.isError) {
    content = (
      <>
        {heading}
        <State
          kind="error"
          className="my-auto"
          onRetry={() => {
            if (eventQuery.isError) void eventQuery.refetch()
            if (participationQuery.isError) void participationQuery.refetch()
          }}
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
