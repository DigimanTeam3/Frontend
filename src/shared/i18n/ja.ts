// All UI text (Japanese). Keys are grouped by screen.
export const ja = {
  common: {
    loading: '読み込み中…',
    error: 'エラーが発生しました。もう一度お試しください。',
    comingSoon: '準備中です。',
  },
  // Screen names by screen ID (S01–S18).
  screens: {
    S01: 'ログイン',
    S02: 'ホーム',
    S03: '検索・絞り込み',
    S04: '3Dマップ',
    S05: 'イベント詳細',
    S06: '同行者を探す',
    S07: '同行募集の登録',
    S08: '申し込み・マッチング',
    S09: '位置認証',
    S10: '参加バッジ',
    S11: 'ミッション一覧',
    S12: 'ミッション提出',
    S13: '完了バッジとカード作成',
    S14: 'カード詳細',
    S15: 'マイページ',
    S16: 'AI窓口',
    S17: '予約券',
    S18: 'お知らせのイベント',
  },
  login: {
    devLogin: '開発用ログイン',
  },
  // Bottom tab bar. `code` is the small printed label above the name (decoration, like on a ticket).
  nav: {
    label: 'メインメニュー',
    home: { code: 'HOME', name: 'ホーム' },
    map: { code: 'MAP', name: 'マップ' },
    wallet: { code: 'WALLET', name: '切符入れ' },
  },
  topBar: {
    back: '戻る',
    close: '閉じる',
  },
  eventList: {
    title: 'ソウルの無料イベント',
    empty: 'イベントがありません。',
  },
  map: {
    title: '近くのイベント',
    unsupported: 'この端末では地図を表示できません（WebGL 非対応）。',
    directions: 'Google マップで経路を見る',
  },
  companion: {
    listTitle: '同行募集',
    filterOpen: '募集中のみ',
    filterAll: 'すべて',
    status: { OPEN: '募集中', FULL: '満席', CLOSED: '締切' },
    mine: '自分の募集',
    requestStatus: { PENDING: '申込中', ACCEPTED: '参加確定', REJECTED: '見送り' },
    meetSuffix: '集合',
    members: (count: number, capacity: number) => `${count}/${capacity}人`,
    emptyOpen: 'いま募集中の同行はありません。',
    emptyAll: 'まだ同行募集がありません。',
    emptyHint: '最初の募集を出してみませんか？',
    create: '募集する',
    viewMine: '自分の募集を見る',
    eventNotFound: 'イベントが見つかりません。',
    retry: '再読み込み',
  },
  notFound: {
    message: 'ページが見つかりません。',
    backHome: 'ホームに戻る',
  },
} as const
