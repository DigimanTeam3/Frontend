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
  // Paper ticket of an event (src/shared/ui/GateTicket.tsx), shown by S09 and S10.
  gateTicket: {
    category: {
      festival: '祭り',
      exhibition: '展示',
      performance: '公演',
    },
    number: (monthDay: string, serial: string) => `No.${monthDay}-${serial}`,
    venueLabel: 'VENUE',
    dateLabel: 'DATE',
    date: (month: string, day: string, weekday: string) => `${month}.${day} ${weekday}`,
    // The double spaces around the dot are part of the design (rendered with white-space: pre).
    stubCaption: 'ADMIT ONE  ·  改札で切り取る',
  },
  // Error block of the journey screens (S09–S13) when the event id in the URL does not exist.
  eventNotFound: {
    title: 'イベントが見つかりません',
    body: 'URLが正しいか、もう一度ご確認ください',
    home: 'ホームへ',
  },
  // Location check-in (S09: src/features/checkin).
  checkIn: {
    title: '到着チェック',
    intro: {
      headline: ['会場に着いたら、', '切符を改札しよう'],
      body: [
        '今いる場所が会場の近くか確認します。',
        '位置情報は到着チェックの時だけ使い、保存しません。',
      ],
      stepPermission: '位置情報の利用を許可する',
      stepRadius: (radiusM: number) => `会場から ${radiusM}m 以内で確認`,
      stepTear: '切符を切り取って参加バッジ獲得',
      start: '位置情報を許可して確認',
      httpsNote: 'HTTPSで接続しているときだけ使えます',
    },
    checking: '確認中…',
    ready: {
      chip: '改札できます',
      // The double spaces around the dot are part of the design (rendered with white-space: pre).
      reading: (distance: string, accuracyM: number) =>
        `会場まで ${distance}  ·  精度 ±${accuracyM}m`,
      pull: '半券を下に引いて改札',
      stubLabel: '半券を切り取って改札する',
    },
    // Keys are the failure reasons of src/features/checkin/failure.ts.
    failureTitle: {
      PERMISSION_DENIED: '位置情報がオフです',
      POSITION_UNAVAILABLE: '現在地を取得できません',
      LOW_ACCURACY: '位置の精度が低いです',
      OUT_OF_RANGE: '会場の範囲外です',
      EVENT_ENDED: 'イベントは終了しました',
      EVENT_NOT_STARTED: 'イベントはまだ始まっていません',
      ALREADY_VERIFIED: 'もうチェック済みです',
      NETWORK: '通信できませんでした',
    },
    failureBody: {
      PERMISSION_DENIED: '設定で位置情報を許可してください',
      POSITION_UNAVAILABLE: '屋外に出て、もう一度お試しください',
      LOW_ACCURACY: 'Wi-Fiをオンにすると精度が上がります',
      ALREADY_VERIFIED: '参加バッジはマイページで見られます',
      NETWORK: '電波の良い場所でお試しください',
      outOfRange: (radiusM: number) => `会場の ${radiusM}m 以内で確認してください`,
      // Two paragraphs, used when the server tells the distance and the radius.
      outOfRangeDistance: (distance: string) => `いまの場所は会場から ${distance} 離れています。`,
      // The venue name goes between the two parts as its own element, because it needs
      // lang="ko" when it is the Korean original.
      outOfRangeRetry: (radiusM: number) => ({
        beforeVenue: '',
        afterVenue: `の ${radiusM}m 以内で、もう一度お試しください。`,
      }),
      period: (start: string, end: string) => `開催期間：${start} – ${end}`,
    },
    actions: {
      retry: 'もう一度',
      retryCheck: 'もう一度確認',
      later: 'あとで',
      venueMap: '地図で会場',
      otherEvents: 'ほかのイベント',
      missions: 'ミッションへ',
    },
  },
  // Participation badge after the ticket is torn (S10: src/features/badge).
  participationBadge: {
    title: '改札完了',
    // Two lines.
    // TODO(S11): the Figma copy says "ミッションが開きました（4つ）". The count is items.length of
    // GET /events/{eventId}/missions; add the query with S11, then make this line a function.
    body: ['参加バッジを手に入れました。', 'ミッションが開きました'],
    // Date, time and the venue name (a separate element, so a Korean original can be marked
    // lang="ko"). The double spaces around the dot are part of the design.
    metaBeforeVenue: (date: string, time: string) => `${date}  ${time}  ·  `,
    stampLabel: (date: string) => `参加バッジ ${date}`,
    stampCaption: 'ADMITTED',
    stampTitle: '参加',
    notVerified: {
      title: 'まだ到着チェックが済んでいません',
      body: '会場で到着チェックをすると、参加バッジがもらえます',
      action: '到着チェックへ',
    },
    actions: {
      missions: 'ミッションを見る',
      later: 'あとで',
    },
  },
} as const
