import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useMissionsQuery } from '@/features/mission/api'
import { MissionList } from '@/features/mission/components/MissionList'
import { useJourneyEventQuery } from '@/shared/api/journey'
import { ja } from '@/shared/i18n/ja'
import { isEventNotFound } from '@/shared/lib/apiError'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'
import { Toast } from '@/shared/ui/Toast'

// The submit screen (S12) comes back here with this router state after a successful submission.
function cameBackAfterSubmit(state: unknown) {
  return (
    typeof state === 'object' && state !== null && 'submitted' in state && state.submitted === true
  )
}

// S11 mission list (/events/:eventId/missions): the missions of one event with my progress.
export function MissionListScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const eventId = parseIdParam(useParams().eventId)
  const eventQuery = useJourneyEventQuery(eventId)
  const missionsQuery = useMissionsQuery(eventId)

  const [toast, setToast] = useState<string | null>(() =>
    cameBackAfterSubmit(location.state) ? ja.mission.submittedToast : null,
  )
  // Clear the router state so a reload does not show the toast again.
  useEffect(() => {
    if (cameBackAfterSubmit(location.state)) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const event = eventQuery.data
  const data = missionsQuery.data

  // No heading is visible in the content (the top bar has no title), so the name stays for screen readers.
  const heading = <h1 className="sr-only">{ja.mission.title}</h1>
  let content: ReactNode
  if (event && data) {
    // Checked before the error states: a failed background refetch must not close a list that
    // is already on screen.
    content = (
      <>
        {heading}
        <MissionList event={event} data={data} />
      </>
    )
  } else if (
    eventId === null ||
    isEventNotFound(eventQuery.error) ||
    isEventNotFound(missionsQuery.error)
  ) {
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
  } else if (eventQuery.isError || missionsQuery.isError) {
    content = (
      <>
        {heading}
        <State
          kind="error"
          className="my-auto"
          onRetry={() => {
            if (eventQuery.isError) void eventQuery.refetch()
            if (missionsQuery.isError) void missionsQuery.refetch()
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

  return (
    <section className="flex flex-1 flex-col">
      {content}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  )
}
