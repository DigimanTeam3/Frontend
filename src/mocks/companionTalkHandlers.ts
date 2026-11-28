import { http, HttpResponse } from 'msw/http'
import { MOCK_ME_ID, findUser, posts, type MockPost } from '@/mocks/data/companions'
import {
  AUTO_REPLIES,
  comments,
  messages,
  type MockComment,
  type MockMessage,
} from '@/mocks/data/companionTalk'
import { errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/utils'
import type { CompanionComment, CompanionMessage } from '@/shared/types/companionChat'

// Comment and chat mocks (S08, issue #83).
//
// Error switches for trying the error states:
// - localStorage 'mock.companionTalk' = 'comments-error' | 'comments-network' | 'chat-error' | 'chat-network'
//   makes the GET of comments or messages fail (500 or no connection).
// - Text containing "#fail" makes the POST of a comment or message answer 500.
// - 403 CHAT_NOT_MEMBER: open the chat of post 103 (full, without me).
// - 409 CHAT_NOT_OPEN: open the chat of post 102 (mine, nobody accepted yet).

const MOCK_TOKEN = 'Bearer mock-access-token'
const COMMENT_MAX = 200
const MESSAGE_MAX = 500
const AUTO_REPLY_DELAY_MS = 3000

function currentUserId(request: Request): number | null {
  return request.headers.get('Authorization') === MOCK_TOKEN ? MOCK_ME_ID : null
}

function mockSwitch(): string | null {
  try {
    return localStorage.getItem('mock.companionTalk')
  } catch {
    return null
  }
}

const postNotFound = () => errorResponse(404, 'COMPANION_NOT_FOUND', 'post not found')
const findPost = (postId: unknown) => posts.find((post) => post.id === Number(postId))
const isMember = (post: MockPost, userId: number) =>
  post.members.some((member) => member.userId === userId)

/** null when the text is fine, or the 400 answer. */
function invalidText(content: unknown, max: number) {
  const text = typeof content === 'string' ? content.trim() : ''
  if (!text || Array.from(text).length > max) {
    return errorResponse(400, 'VALIDATION_ERROR', `content must be 1-${max} characters`, 'content')
  }
  return null
}

function toComment(comment: MockComment, meId: number | null): CompanionComment {
  return {
    id: comment.id,
    postId: comment.postId,
    author: findUser(comment.authorId),
    content: comment.content,
    createdAt: comment.createdAt,
    isMine: comment.authorId === meId,
  }
}

function toMessage(message: MockMessage, meId: number): CompanionMessage {
  return {
    id: message.id,
    postId: message.postId,
    sender: findUser(message.senderId),
    content: message.content,
    createdAt: message.createdAt,
    isMine: message.senderId === meId,
  }
}

/** 403 / 409 for someone who cannot use the chat yet, or null. */
function chatDenied(post: MockPost, meId: number) {
  if (!isMember(post, meId)) return errorResponse(403, 'CHAT_NOT_MEMBER', 'not a member')
  if (post.members.length < 2) return errorResponse(409, 'CHAT_NOT_OPEN', 'no accepted member')
  return null
}

let nextCommentId = 100
let nextMessageId = 100

export const companionTalkHandlers = [
  http.get('/api/companions/:postId/comments', async ({ request, params }) => {
    await mockDelay()
    const mode = mockSwitch()
    if (mode === 'comments-network') return HttpResponse.error()
    if (mode === 'comments-error') return errorResponse(500, 'INTERNAL_ERROR', 'Mock error')
    const post = findPost(params.postId)
    if (!post) return postNotFound()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get('size') ?? 20) || 20))
    const meId = currentUserId(request)
    const all = comments.filter((comment) => comment.postId === post.id)
    const items = all.slice((page - 1) * size, page * size).map((c) => toComment(c, meId))
    return HttpResponse.json({ items, page, size, total: all.length })
  }),

  http.post('/api/companions/:postId/comments', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    const body = (await request.json().catch(() => ({}))) as { content?: unknown }
    const invalid = invalidText(body.content, COMMENT_MAX)
    if (invalid) return invalid
    const content = String(body.content).trim()
    if (content.includes('#fail')) return errorResponse(500, 'INTERNAL_ERROR', 'Mock error')

    const comment = {
      id: nextCommentId++,
      postId: post.id,
      authorId: meId,
      content,
      createdAt: new Date().toISOString(),
    }
    comments.push(comment)
    return HttpResponse.json(toComment(comment, meId), { status: 201 })
  }),

  http.delete('/api/companions/:postId/comments/:commentId', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    const index = comments.findIndex(
      (c) => c.postId === post.id && c.id === Number(params.commentId),
    )
    if (index === -1) return errorResponse(404, 'COMMENT_NOT_FOUND', 'comment not found')
    if (comments[index].authorId !== meId) {
      return errorResponse(403, 'NOT_AUTHOR', 'only the writer can delete this')
    }
    comments.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/companions/:postId/messages', async ({ request, params }) => {
    await mockDelay(200)
    const mode = mockSwitch()
    if (mode === 'chat-network') return HttpResponse.error()
    if (mode === 'chat-error') return errorResponse(500, 'INTERNAL_ERROR', 'Mock error')
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    const denied = chatDenied(post, meId)
    if (denied) return denied

    const url = new URL(request.url)
    const afterId = Math.max(0, Number(url.searchParams.get('afterId') ?? 0) || 0)
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size') ?? 50) || 50))
    const newer = messages.filter((m) => m.postId === post.id && m.id > afterId)
    const items = newer.slice(0, size).map((m) => toMessage(m, meId))
    return HttpResponse.json({ items, hasMore: newer.length > size })
  }),

  http.post('/api/companions/:postId/messages', async ({ request, params }) => {
    await mockDelay()
    const meId = currentUserId(request)
    if (meId === null) return unauthorizedResponse()
    const post = findPost(params.postId)
    if (!post) return postNotFound()
    const denied = chatDenied(post, meId)
    if (denied) return denied
    const body = (await request.json().catch(() => ({}))) as { content?: unknown }
    const invalid = invalidText(body.content, MESSAGE_MAX)
    if (invalid) return invalid
    const content = String(body.content).trim()
    if (content.includes('#fail')) return errorResponse(500, 'INTERNAL_ERROR', 'Mock error')

    const message = {
      id: nextMessageId++,
      postId: post.id,
      senderId: meId,
      content,
      createdAt: new Date().toISOString(),
    }
    messages.push(message)

    // Another member answers a little later; the screen picks it up with its next poll.
    const other = post.members.find((member) => member.userId !== meId)
    if (other) {
      setTimeout(() => {
        messages.push({
          id: nextMessageId++,
          postId: post.id,
          senderId: other.userId,
          content: AUTO_REPLIES[message.id % AUTO_REPLIES.length],
          createdAt: new Date().toISOString(),
        })
      }, AUTO_REPLY_DELAY_MS)
    }
    return HttpResponse.json(toMessage(message, meId), { status: 201 })
  }),
]
