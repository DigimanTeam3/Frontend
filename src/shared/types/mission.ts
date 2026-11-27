import type { Badge } from '@/shared/types/badge'
import type { ExperienceCard } from '@/shared/types/card'

/** How a mission is answered: one photo (with an optional comment) or a text. */
export type MissionVerificationMethod = 'photo' | 'text'

/** A submission is approved at once, so there is no "in review" state on screen. */
export interface Submission {
  id: number
  missionId: number
  userId: number
  submissionType: MissionVerificationMethod
  text: string | null
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

/** GET /events/{eventId}/missions */
export interface MissionListResponse {
  items: Mission[]
  requiredCount: number
  myCompletedRequiredCount: number
  /** My location check-in of this event has passed. Missions only open after it. */
  isVerified: boolean
}

/** Body of POST /missions/{missionId}/submissions: photo mission `{ image, text? }`, text mission `{ text }`. */
export interface SubmissionRequest {
  /** URL from the image upload (POST /uploads/images). */
  image?: string
  text?: string
}

/** Answer of POST /missions/{missionId}/submissions. */
export interface SubmissionResult {
  submission: Submission
  /** Both are set only when this submission finished the last required mission of the event. */
  completeBadge: Badge | null
  experienceCard: ExperienceCard | null
}
