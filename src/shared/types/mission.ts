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
