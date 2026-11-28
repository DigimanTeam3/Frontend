import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'
import { apiErrorCode, isApiError } from '@/shared/api/errors'
import type { JourneyEvent } from '@/shared/types/eventBrief'
import type { Participation } from '@/shared/types/participation'

// Reads shared by the journey screens (check-in → badge → missions → card): the event and my
// participation in it. They live in shared/ because features must not import each other.

/** One retry for network / server trouble; a 4xx answer will not change by asking again. */
export function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isApiError(error) ? error.status : null
  if (status !== null && status >= 400 && status < 500) return false
  return failureCount < 1
}

// TEMP: GET /events/{eventId} typed with only the fields these screens read. Cached under its
// own key: the event detail (S05) keeps the full shape under `events.detail`, and a screen that
// found this subset there would miss fields.
export function getJourneyEvent(eventId: number) {
  return apiClient<JourneyEvent>(`/events/${eventId}`)
}

export function useJourneyEventQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.journeyEvents.detail(eventId ?? 0),
    queryFn: () => getJourneyEvent(eventId ?? 0),
    enabled: eventId !== null,
    retry: retryUnlessClientError,
  })
}

/** My participation in the event, or null when I have none yet (404 PARTICIPATION_NOT_FOUND). */
export async function getParticipation(eventId: number): Promise<Participation | null> {
  try {
    return await apiClient<Participation>(`/events/${eventId}/participation`)
  } catch (error) {
    if (apiErrorCode(error) === 'PARTICIPATION_NOT_FOUND') return null
    throw error
  }
}

export function useParticipationQuery(eventId: number | null) {
  return useQuery({
    queryKey: queryKeys.participations.byEvent(eventId ?? 0),
    queryFn: () => getParticipation(eventId ?? 0),
    enabled: eventId !== null,
    retry: retryUnlessClientError,
  })
}
