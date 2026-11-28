// Comments and chat on a companion post (S08). Shapes from the API proposal in issue #83.
import type { UserSummary } from '@/shared/types/companion'

/** One comment under a post. Anyone can read them; only the writer can delete one. */
export interface CompanionComment {
  id: number
  postId: number
  author: UserSummary
  /** 1–200 characters after trimming. */
  content: string
  createdAt: string
  isMine: boolean
}

export interface CompanionCommentListResponse {
  items: CompanionComment[]
  page: number
  size: number
  total: number
}

/** Body for POST /companions/{postId}/comments and POST /companions/{postId}/messages. */
export interface CompanionTextBody {
  content: string
}

/** One chat message. Only the author and accepted members can read and send them. */
export interface CompanionMessage {
  id: number
  postId: number
  sender: UserSummary
  /** 1–500 characters after trimming. */
  content: string
  createdAt: string
  isMine: boolean
}

/** Messages with an id above `afterId`, oldest first. `hasMore`: ask again with the last id. */
export interface CompanionMessageListResponse {
  items: CompanionMessage[]
  hasMore: boolean
}
