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
  notFound: {
    message: 'ページが見つかりません。',
    backHome: 'ホームに戻る',
  },
  // Shared loading / empty / error block (C9: src/shared/ui/State.tsx).
  state: {
    loading: '読み込み中…',
    errorTitle: '読み込めませんでした',
    errorBody: '通信状態を確認して、もう一度お試しください',
    retry: '再読み込み',
  },
  // Photo picker with preview and upload (C8: src/shared/ui/ImageUploader.tsx).
  imageUploader: {
    add: '写真を追加',
    remove: '写真を削除',
    previewAlt: '選んだ写真',
    uploading: '送信中…',
    // Keys are API error codes of POST /uploads/images, plus NETWORK and UNKNOWN.
    errors: {
      UNSUPPORTED_IMAGE_TYPE: 'この形式の写真は使えません。別の写真を選んでください。',
      FILE_TOO_LARGE: '写真のサイズが大きすぎます。別の写真を選んでください。',
      EMPTY_FILE: '写真を読み込めませんでした。もう一度選んでください。',
      NETWORK: '通信できませんでした。電波の良い場所でもう一度お試しください。',
      UNKNOWN: '写真を送れませんでした。もう一度お試しください。',
    },
  },
} as const
