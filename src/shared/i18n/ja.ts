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
    // Sample ticket on the hero card (the Hangul line shows "the original becomes readable").
    sampleTitle: 'ソウル光の提灯祭り',
    sampleOriginal: '서울빛초롱축제',
    samplePrice: '¥0',
    sampleFree: 'FREE',
    headline: 'ソウルの無料イベントを、\n友だちと切符にしよう。',
    lead: 'ハングルの情報も日本語で。行って、到着チェックして、思い出をカードに残せます。',
    lineButton: 'LINEでログイン',
    browse: 'ログインせずに見てみる',
    terms: 'ログインすると利用規約とプライバシーポリシーに同意したことになります',
    processing: 'ログイン中…',
    cancelled: 'ログインをキャンセルしました。',
    failed: 'ログインに失敗しました。もう一度お試しください。',
    expired: 'ログインの有効期限が切れました。もう一度ログインしてください。',
    loggedOut: 'ログアウトしました。',
    loggedInAs: (name: string) => `${name}さんとしてログイン中です`,
    goHome: 'ホームへ',
    logout: 'ログアウト',
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
  notFound: {
    message: 'ページが見つかりません。',
    backHome: 'ホームに戻る',
  },
} as const
