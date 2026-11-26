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

/** Body for POST /events/{eventId}/companions. */
export interface CreateCompanionBody {
  meetAt: string
  capacity: number
  intro: string
}

/** Seat on the ticket: the author is 1A, accepted people follow (1B, 1C, 1D). */
export interface CompanionMember {
  user: UserSummary
  seat: string
  joinedAt: string
  /** True for the logged-in user's own seat. */
  isMe: boolean
}

export interface CompanionRequest {
  id: number
  user: UserSummary
  status: CompanionRequestStatus
  createdAt: string
}

export interface CompanionPostDetail extends CompanionPostSummary {
  event: EventSummary
  members: CompanionMember[]
  /** My request on someone else's post (null if none, cancelled, or my own post). */
  myRequest: Omit<CompanionRequest, 'user'> | null
  /** Requests on my post; empty for other people's posts. */
  requests: CompanionRequest[]
}
