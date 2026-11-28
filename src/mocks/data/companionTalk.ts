// In-memory comments and chat messages for mock mode (S08, issue #83). Reset on reload.
// Post ids and users match src/mocks/data/companions.ts.

export interface MockComment {
  id: number
  postId: number
  authorId: number
  content: string
  createdAt: string
}

export interface MockMessage {
  id: number
  postId: number
  senderId: number
  content: string
  createdAt: string
}

export const comments: MockComment[] = [
  {
    id: 1,
    postId: 101,
    authorId: 13,
    content: '何時ごろ集まりますか？',
    createdAt: '2026-11-26T09:12:00+09:00',
  },
  {
    id: 2,
    postId: 101,
    authorId: 11,
    content: '18時に清渓広場の入口で集合の予定です！',
    createdAt: '2026-11-26T09:40:00+09:00',
  },
  {
    id: 3,
    postId: 101,
    authorId: 1,
    content: '写真撮るの好きなので、ぜひご一緒したいです。',
    createdAt: '2026-11-26T11:05:00+09:00',
  },
  {
    id: 4,
    postId: 103,
    authorId: 14,
    content: 'お昼ごはんも一緒に食べませんか？',
    createdAt: '2026-11-25T10:00:00+09:00',
  },
]

export const messages: MockMessage[] = [
  {
    id: 1,
    postId: 101,
    senderId: 11,
    content: 'さきさん、承認しました！よろしくお願いします。',
    createdAt: '2026-11-25T21:12:00+09:00',
  },
  {
    id: 2,
    postId: 101,
    senderId: 12,
    content: 'よろしくお願いします！カメラ持っていきますね。',
    createdAt: '2026-11-25T21:20:00+09:00',
  },
  {
    id: 3,
    postId: 103,
    senderId: 13,
    content: '13時に広場の噴水前でお願いします。',
    createdAt: '2026-11-24T19:00:00+09:00',
  },
]

/** Replies another member sends a few seconds after mine, so polling can be seen working. */
export const AUTO_REPLIES = [
  'いいですね！',
  '了解です。当日楽しみにしています。',
  '会場に着いたらここで連絡しますね。',
]
