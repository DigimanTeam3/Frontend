import type { Badge } from '@/shared/types/badge'
import type { ExperienceCard } from '@/shared/types/card'

/** How a mission is answered: one photo (with an optional comment) or a text. */
export type MissionVerificationMethod = 'photo' | 'text'

/** A submission is approved at once, so there is no "in review" state on screen. */
export interface Submission {
  id: number
  missionId: number
  submissionType: MissionVerificationMethod
  text: string | null
  /** URL of the submitted photo (the answer carries it as `image` and as `imageUrl`). */
  image: string | null
  verificationStatus: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export interface Mission {
  id: number
  eventId: number
  /** Original (Korean) title. */
  title: string
  /** Japanese title; null means only the original text exists. */
  titleJa: string | null
  description: string | null
  descriptionJa: string | null
  difficulty: 'easy' | 'normal' | 'hard'
  verificationMethod: MissionVerificationMethod
  /** Only the required missions lead to the completion badge and the experience card. */
  required: boolean
  sortOrder: number
  /** My submission, or null while I have not done the mission. */
  mySubmission: Submission | null
}

/** Progress in the required missions as GET /events/{eventId}/missions carries it. */
export interface MissionListProgress {
  completedRequired: number
  totalRequired: number
}

/** GET /events/{eventId}/missions as the server answers. */
export interface MissionListAnswer {
  eventId: number
  /** My check-in of this event has passed, so I may submit. False without a login. */
  canSubmit: boolean
  progress: MissionListProgress
  items: Mission[]
}

/** The mission list as the screens read it (see toMissionList in shared/api/missions). */
export interface MissionListResponse {
  items: Mission[]
  requiredCount: number
  myCompletedRequiredCount: number
  /** My location check-in of this event has passed. Missions only open after it. */
  isVerified: boolean
}

/**
 * Body of POST /missions/{missionId}/submissions: a photo mission sends `imageUrl` (and maybe a
 * comment in `text`), a text mission sends `text` (1 to 200 characters).
 */
export interface SubmissionRequest {
  submissionType: MissionVerificationMethod
  /** URL from the image upload (POST /uploads/images). */
  imageUrl?: string
  text?: string
}

/** My progress in the required missions of the event, after a submission. */
export interface MissionProgress {
  completedRequired: number
  totalRequired: number
  isAllCompleted: boolean
}

/** Answer of POST /missions/{missionId}/submissions. */
export interface SubmissionResult {
  submission: Submission
  progress: MissionProgress
  /** Both are set only when this submission finished the last required mission of the event. */
  completeBadge: Badge | null
  experienceCard: ExperienceCard | null
}
