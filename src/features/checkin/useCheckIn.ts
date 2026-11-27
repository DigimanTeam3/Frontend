import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useCreateParticipationMutation,
  useVerifyParticipationMutation,
} from '@/features/checkin/api'
import {
  failureFromApiError,
  failureFromGeolocation,
  type CheckInFailure,
} from '@/features/checkin/failure'
import { useCurrentPosition } from '@/shared/lib/useCurrentPosition'
import type { Participation } from '@/shared/types/participation'

/** intro: before the check. ready: the server said yes, the ticket can be torn. failed: it said no. */
export type CheckInStage = 'intro' | 'ready' | 'failed'

/** What the "ready" stage prints under the chip. */
export interface CheckInReading {
  /** Meters to the venue, measured by the server. */
  distanceM: number
  /** Accuracy of my position in meters, rounded. */
  accuracyM: number
}

interface CheckInState {
  stage: CheckInStage
  failure: CheckInFailure | null
  reading: CheckInReading | null
  participation: Participation | null
}

/**
 * The check-in of one event: join (create-or-get), measure the position, ask the server to verify.
 * `initialParticipation` is my participation when the screen opened (null = none yet).
 */
export function useCheckIn(eventId: number, initialParticipation: Participation | null) {
  const [state, setState] = useState<CheckInState>(() => {
    // Already checked in before this visit: there is nothing to verify again.
    const verified = initialParticipation?.status === 'verified'
    return {
      stage: verified ? 'failed' : 'intro',
      failure: verified ? { reason: 'ALREADY_VERIFIED' } : null,
      reading: null,
      participation: initialParticipation,
    }
  })
  const [busy, setBusy] = useState(false)

  // maxAccuracyM stays unset: the server judges the accuracy, not this screen.
  const { locate, reset: stopLocating } = useCurrentPosition()
  const { mutateAsync: createParticipation } = useCreateParticipationMutation(eventId)
  const { mutateAsync: verifyParticipation } = useVerifyParticipationMutation(eventId)

  // A run that ends after the screen closed must not touch the state.
  const runRef = useRef(0)
  useEffect(
    () => () => {
      runRef.current += 1
    },
    [],
  )

  const start = useCallback(async () => {
    const run = ++runRef.current
    const isCurrent = () => runRef.current === run
    const fail = (failure: CheckInFailure) => {
      setState((previous) => ({ ...previous, stage: 'failed', failure }))
      setBusy(false)
    }
    setBusy(true)

    // Joining and measuring start together: the GPS needs a few seconds anyway.
    const locating = locate()
    let participation: Participation
    try {
      participation = await createParticipation()
    } catch (error) {
      // A participation error wins over a location error, so the position is not waited for.
      stopLocating()
      if (isCurrent()) fail(failureFromApiError(error))
      return
    }

    const located = await locating
    if (!isCurrent()) return
    setState((previous) => ({ ...previous, participation }))
    if (located.error) {
      const failure = failureFromGeolocation(located.error.code)
      if (failure) fail(failure)
      else setBusy(false)
      return
    }

    try {
      const { lat, lng, accuracy } = located.position
      const result = await verifyParticipation({
        participationId: participation.id,
        position: { lat, lng, accuracy },
      })
      if (!isCurrent()) return
      setState({
        stage: 'ready',
        failure: null,
        reading: { distanceM: result.distanceM, accuracyM: Math.round(accuracy) },
        participation: result.participation,
      })
      setBusy(false)
    } catch (error) {
      if (isCurrent()) fail(failureFromApiError(error))
    }
  }, [locate, stopLocating, createParticipation, verifyParticipation])

  return { ...state, busy, start }
}
