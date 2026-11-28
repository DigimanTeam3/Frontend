import { useParams } from 'react-router'
import { ChatRoom } from '@/features/companion/chat/ChatRoom'

// S08 chat: the author and accepted members of a companion post talk before meeting.
export function CompanionChatPage() {
  const postId = Number(useParams().postId)
  // A new post id starts a fresh room (messages and scroll position).
  return <ChatRoom key={postId} postId={postId} />
}
