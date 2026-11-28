import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMissionsQuery } from '@/features/mission/api'
import { MissionSubmitForm } from '@/features/mission/components/MissionSubmitForm'
import { MissionSubmitted } from '@/features/mission/components/MissionSubmitted'
import { ja } from '@/shared/i18n/ja'
import { isEventNotFound } from '@/shared/lib/apiError'
import { parseIdParam, paths } from '@/shared/lib/paths'
import { EventNotFoundState } from '@/shared/ui/EventNotFoundState'
import { PinIcon } from '@/shared/ui/icons/PinIcon'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// S12 mission submission (/events/:eventId/missions/:missionId). There is no single-mission
// API, so the mission comes out of the list of S11 (same query, same cache).
export function MissionSubmitScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const eventId = parseIdParam(params.eventId)
  const missionId = parseIdParam(params.missionId)
  const missionsQuery = useMissionsQuery(eventId)
  // A mission the server refused as unknown while submitting (404 MISSION_NOT_FOUND).
  const [goneMissionId, setGoneMissionId] = useState<number | null>(null)

  const { missionSubmit: copy } = ja
  const data = missionsQuery.data

  // The states without a mission on screen have no visible heading.
  const heading = <h1 className="sr-only">{copy.title}</h1>
  let content: ReactNode
  if (eventId !== null && data) {
    // Checked before the error states: a failed background refetch must not close a form
    // that is already on screen.
    const missions = data.items.toSorted((a, b) => a.sortOrder - b.sortOrder)
    const index = missions.findIndex((item) => item.id === missionId)
    const mission = index === -1 ? undefined : missions[index]

    if (!mission || mission.id === goneMissionId) {
      content = (
        <>
          {heading}
          <State
            kind="error"
            className="my-auto"
            icon={<SearchIcon />}
            title={copy.notFound.title}
            body={copy.notFound.body}
            action={{
              label: copy.notFound.action,
              onClick: () => navigate(paths.missions(eventId)),
            }}
          />
        </>
      )
    } else if (!data.isVerified) {
      content = (
        <>
          {heading}
          <State
            kind="empty"
            className="my-auto"
            icon={<PinIcon />}
            title={copy.notVerified.title}
            body={copy.notVerified.body}
            action={{
              label: copy.notVerified.action,
              onClick: () => navigate(paths.checkIn(eventId)),
            }}
          />
        </>
      )
    } else if (mission.mySubmission) {
      content = (
        <MissionSubmitted
          key={mission.id}
          mission={mission}
          position={index + 1}
          submission={mission.mySubmission}
        />
      )
    } else {
      content = (
        <MissionSubmitForm
          key={mission.id}
          mission={mission}
          position={index + 1}
          onMissionNotFound={() => setGoneMissionId(mission.id)}
        />
      )
    }
  } else if (eventId === null || isEventNotFound(missionsQuery.error)) {
    content = (
      <>
        {heading}
        <EventNotFoundState />
      </>
    )
  } else if (missionsQuery.isError) {
    content = (
      <>
        {heading}
        <State kind="error" className="my-auto" onRetry={() => void missionsQuery.refetch()} />
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
