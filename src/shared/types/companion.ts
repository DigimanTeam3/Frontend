// Companion (S06–S08) shapes from the API proposals in GitHub issues (S06 #16). Field names are camelCase.

/** OPEN: seats left / FULL: every seat matched / CLOSED: meeting time has passed. */
export type CompanionStatus = 'OPEN' | 'FULL' | 'CLOSED'

export type CompanionRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

/** Filter for the list: only open posts (default) or all of them. */
export type CompanionListFilter = 'OPEN' | 'ALL'

/** Event fields the companion screens need (event strip, meeting place, date range). */
export interface EventSummary {
  id: number
  title: string
  titleJa: string | null
  venueName: string
  venueNameJa: string | null
  imageUrl: string | null
  startDate: string
  endDate: string
}

/** Only a display name is shared between users. */
export interface UserSummary {
  id: number
  nickname: string
}

export interface CompanionPostSummary {
  id: number
  eventId: number
  author: UserSummary
  /** One-line introduction (1–60 characters). */
  intro: string
  meetAt: string
  /** 2–4, including the author. */
  capacity: number
  /** Author + accepted people. */
  memberCount: number
  status: CompanionStatus
  isMine: boolean
  myRequestStatus: CompanionRequestStatus | null
  createdAt: string
}

export interface CompanionListResponse {
  event: EventSummary
  items: CompanionPostSummary[]
  page: number
  size: number
  total: number
}
