// All UI text (Japanese). Rules and checklist: docs/copy.md.
// - One section per screen or feature (camelCase, e.g. eventDetail). Do not edit other screens' sections.
// - `common`: words two or more screens use. `format`: pieces for src/shared/i18n/format.ts.
// - Text with numbers or names is a function, e.g. `loggedInAs: (name: string) => ...`.
//   Do not join pieces of copy in components.
export const ja = {
  common: {
    loading: '読み込み中…',
    error: 'エラーが発生しました。もう一度お試しください。',
    comingSoon: '準備中です。',
    // Network failure (no answer from the server).
    offline: '通信できませんでした。接続を確認して、もう一度お試しください。',
    retry: 'もう一度試す',
    free: '無料',
    // Original (Korean) text shown as is, with lang="ko".
    noTranslation: '日本語訳なし',
    autoTranslated: '自動翻訳',
    showOriginal: '原文を見る',
    showJapanese: '日本語で見る',
  },
  // Date, time and count pieces. Use the helpers in src/shared/i18n/format.ts, not these directly.
  format: {
    monthDay: (month: number, day: number) => `${month}月${day}日`,
    yearMonthDay: (year: number, month: number, day: number) => `${year}年${month}月${day}日`,
    weekday: (weekday: string) => `（${weekday}）`,
    rangeSeparator: '〜',
    count: (count: string) => `${count}件`,
    people: (count: string) => `${count}人`,
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
    guestButton: 'ゲストで試す',
    browse: 'ログインせずに見てみる',
    terms: 'ログインすると利用規約とプライバシーポリシーに同意したことになります',
    processing: 'ログイン中…',
    cancelled: 'ログインをキャンセルしました。',
    failed: 'ログインに失敗しました。もう一度お試しください。',
    lineUnavailable: 'いまはLINEでログインできません。「ゲストで試す」からお試しください。',
    guestFailed: 'ゲストログインに失敗しました。しばらくしてからもう一度お試しください。',
    network: '通信できませんでした。接続を確認して、もう一度お試しください。',
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
  eventCategory: {
    festival: '祭り',
    exhibition: '展示',
    performance: '公演',
  },
  eventDetail: {
    back: '戻る',
    share: '共有',
    linkCopied: 'リンクをコピーしました',
    status: {
      upcoming: '開催前',
      ongoing: '開催中',
      ended: '終了',
    },
    free: '無料',
    autoTranslated: '自動翻訳',
    showOriginal: '原文を見る',
    showJapanese: '日本語で見る',
    noTranslation: '日本語訳なし',
    dateTime: '日時',
    place: '場所',
    openMap: '地図で見る',
    fee: '料金',
    noReservation: '予約不要・どなたでも',
    reservationRequired: '事前予約が必要です',
    howToJoin: '参加方法',
    howToJoinDefault: 'そのまま会場へ',
    missionHint: '到着チェックでミッションが開きます',
    openMissions: 'ミッションを見る',
    about: 'どんなイベント？',
    companions: '一緒に行く人を探す',
    companionCount: (count: number) => `${count}件`,
    noCompanions: 'まだ募集はありません。最初の募集を書いてみませんか？',
    checkInHint: '会場に着いたら到着チェックできます',
    writeRecruit: '募集を書く',
    checkIn: '到着チェック',
    notFound: 'イベントが見つかりません',
    notFoundHint: '終了したか、URLが間違っている可能性があります。',
    retry: 'もう一度試す',
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
  // S16 AI concierge. The counter clerk is the station dog 「ディグ」.
  concierge: {
    topBarTitle: 'AI窓口 · CONCIERGE',
    sign: 'ご案内窓口',
    signCode: 'INFORMATION',
    clerk: '駅員のディグ',
    lead: '行きたい気分を、日本語でそのまま話してください。ソウルの無料イベントを切符にしてお渡しします。',
    status: {
      idle: { code: 'OPEN', text: 'ご用件をどうぞ' },
      listening: { code: 'LISTENING', text: '聞いています' },
      thinking: { code: 'SEARCHING', text: '切符を探しています' },
      speaking: { code: 'ISSUED', text: 'ご案内します' },
      clarify: { code: 'QUESTION', text: 'ひとつ確認させてください' },
      notFound: { code: 'NO MATCH', text: '見つかりませんでした' },
    },
    startersLabel: 'たとえば、こう聞けます',
    starters: [
      '今週末、一人でも行けるイベントある？',
      '今夜行ける無料イベントは？',
      '雨でも楽しめるものを教えて',
    ],
    request: { code: 'REQUEST', label: '申込', voice: '音声' },
    reply: {
      code: 'COUNTER',
      label: '窓口',
      speak: '読み上げる',
      stopSpeaking: '読み上げを止める',
      conditions: 'ご案内条件',
      issued: (count: number) => `切符 ${count}枚を発券しました`,
      suggestionsLabel: '続けて聞く',
    },
    thinking: '発券中',
    conditions: {
      alone: '一人で',
      group: '誰かと',
      category: { festival: '祭り', exhibition: '展示', performance: '公演' },
    },
    ticket: {
      category: {
        festival: { ja: '祭り', code: 'FESTIVAL' },
        exhibition: { ja: '展示', code: 'EXHIBIT' },
        performance: { ja: '公演', code: 'STAGE' },
      },
      otherCategory: { ja: 'イベント', code: 'EVENT' },
      admit: 'ADMIT',
      admitCount: 'ONE',
      original: '原題',
      noTranslation: '日本語訳なし',
      date: 'DATE',
      venue: 'VENUE',
      fare: 'FARE',
      free: '無料',
      freeCode: 'FREE',
      paid: '有料',
      reason: 'おすすめ理由',
      detail: '詳細を見る',
      map: '地図で見る',
      companions: (count: number) => `同行者を探す（${count}件）`,
    },
    reservation: {
      code: 'RESERVATION',
      title: '予約券',
      body: '条件に合うイベントが出たら、LINEでお知らせします。',
      cta: 'この条件で予約券をつくる',
    },
    composer: {
      label: '質問',
      placeholder: '日本語で質問してください',
      send: '送る',
      mic: '話して質問する',
      stop: '録音を止めて送る',
      recording: '聞いています',
      maxLength: (count: number, max: number) => `${count}/${max}`,
    },
    errors: {
      invalid: 'メッセージを確認してください。',
      retryIn: (seconds: number) => `${seconds}秒後に送れます`,
      rateLimited: (seconds: number | null) =>
        seconds
          ? `混み合っています。${seconds}秒後にもう一度どうぞ。`
          : '混み合っています。少し待ってからもう一度どうぞ。',
      unavailable: 'ただいま窓口はお休み中です。',
      failed: 'うまく届きませんでした。',
      notRecognized: '聞き取れませんでした。もう一度話すか、文字で入力してください。',
      audio: '録音を読み取れませんでした。文字で入力してください。',
      micDenied: 'マイクが使えません。文字で入力してください。',
      micUnavailable: 'マイクを使えませんでした。もう一度試すか、文字で入力してください。',
      retry: 'もう一度送る',
      search: '検索で探す',
    },
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
      // An empty file.
      VALIDATION_ERROR: '写真を読み込めませんでした。もう一度選んでください。',
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
      popup: 'ポップアップ',
    },
    // A category this app does not know yet.
    otherCategory: 'イベント',
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
      EVENT_LOCATION_UNAVAILABLE: '到着チェックができません',
      NETWORK: '通信できませんでした',
    },
    failureBody: {
      PERMISSION_DENIED: '設定で位置情報を許可してください',
      POSITION_UNAVAILABLE: '屋外に出て、もう一度お試しください',
      LOW_ACCURACY: 'Wi-Fiをオンにすると精度が上がります',
      ALREADY_VERIFIED: '参加バッジはマイページで見られます',
      EVENT_LOCATION_UNAVAILABLE: 'このイベントは会場の位置がまだ登録されていません',
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
    // Two lines. The second one carries the number of missions when the event tells it
    // (`missionCount` of the event detail).
    body: (missionCount: number | undefined) => [
      '参加バッジを手に入れました。',
      missionCount ? `ミッションが開きました（${missionCount}つ）` : 'ミッションが開きました',
    ],
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
  // Mission list (S11: src/features/mission).
  mission: {
    title: 'ミッション',
    required: '必須',
    verifiedTag: '認証済み',
    hint: '必須ミッションをすべて終えると、完走バッジと思い出カードができます',
    hintDone: '必須ミッションをすべて終えました。完走バッジと思い出カードができました',
    count: (done: number, total: number) => `${done}/${total}`,
    progressLabel: (done: number, total: number) => `必須ミッション ${total}件中 ${done}件完了`,
    status: {
      locked: '到着チェック後に開きます',
      todo: '未完了',
      todoOptional: '未完了 · 任意',
      done: '完了',
      doneOptional: '完了 · 任意',
    },
    notVerified: {
      body: '到着チェックを済ませると、ミッションに挑戦できます',
      action: '到着チェックへ',
    },
    empty: {
      title: 'ミッションはまだありません',
      body: 'このイベントにはミッションがありません',
      action: 'イベントの詳細へ',
    },
    viewCard: '思い出カードを見る',
    submittedToast: 'ミッションを提出しました',
  },
  // Mission submission (S12: src/features/mission/MissionSubmitScreen.tsx).
  missionSubmit: {
    title: 'ミッション提出',
    // Place of the mission in the list, two digits: "MISSION 03".
    number: (position: number) => `MISSION ${String(position).padStart(2, '0')}`,
    photoLabel: '写真',
    photoHelp: '1枚 · 自動で小さくして送ります',
    textLabel: 'ひとこと',
    counter: (length: number, max: number) => `${length} / ${max}`,
    submit: '提出する',
    submitting: '提出中…',
    // Keys are API error codes of POST /missions/{missionId}/submissions, plus UNKNOWN
    // (network, server and every other error).
    errors: {
      NOT_VERIFIED: '到着チェックが必要です',
      ALREADY_SUBMITTED: 'このミッションは提出済みです',
      IMAGE_REQUIRED: '写真を追加してください',
      // A text that is empty or longer than 200 characters.
      VALIDATION_ERROR: 'ひとことは1〜200文字で入力してください',
      UNKNOWN: '通信できませんでした。電波の良い場所でもう一度お試しください。',
    },
    toCheckIn: '到着チェックへ',
    notVerified: {
      title: 'まだ到着チェックが済んでいません',
      body: '会場で到着チェックを済ませると、ミッションを提出できます',
      action: '到着チェックへ',
    },
    notFound: {
      title: 'ミッションが見つかりません',
      body: 'ミッション一覧から選び直してください',
      action: 'ミッション一覧へ',
    },
    // Read-only view of a mission I already submitted.
    submitted: {
      done: '完了',
      date: (date: string) => `${date} に提出`,
      photoAlt: '提出した写真',
      backToList: 'ミッション一覧へ',
    },
  },
  // Polaroid experience card (src/shared/ui/PolaroidCard.tsx), shown by S13, S14 and My Page.
  polaroidCard: {
    // "2026.11.29", from the parts of the card's eventDate.
    date: (year: string, month: string, day: string) => `${year}.${month}.${day}`,
    // The venue name follows as its own element, so a Korean original can be marked lang="ko".
    metaBeforeVenue: (date: string) => `${date} ・ `,
    number: (cardId: number) => `No.${String(cardId).padStart(3, '0')}`,
  },
  // Label on the round badge sticker (src/shared/ui/BadgeSticker.tsx).
  badgeSticker: {
    participation: '参加',
    complete: '完走',
    photo: '写真',
  },
  // Completion badge and card creation (S13: src/features/card/CompleteScreen.tsx).
  complete: {
    // Screen name for screen readers in the states without the visible heading.
    screenName: 'カード生成',
    title: '完走！',
    subtitle: 'カードができました',
    trayTitle: 'バッジをはる',
    trayHint: 'ドラッグして好きな場所に',
    save: 'カードを保存する',
    badgeName: {
      participation: '参加バッジ',
      complete: '完走バッジ',
    },
    lockedBadge: '写真バッジ（まだ持っていません）',
    // Screen reader labels of the sticker controls: a tray badge I can put on the card, a tray
    // badge that is on the card already, and the remove button of a sticker.
    placeBadge: {
      participation: '参加バッジをカードにはる',
      complete: '完走バッジをカードにはる',
    },
    usedBadge: {
      participation: '参加バッジ（カードにはってあります）',
      complete: '完走バッジ（カードにはってあります）',
    },
    removeBadge: {
      participation: '参加バッジをはがす',
      complete: '完走バッジをはがす',
    },
    // Read after the name of a sticker on the card.
    stickerHint:
      'EnterキーかSpaceキーで選び、矢印キーで動かします。Deleteキーではがし、Escキーで選択をやめます。',
    noCard: {
      title: 'まだカードはありません',
      body: '必須ミッションをすべて終えると、完走バッジと思い出カードができます',
      action: 'ミッションへ',
    },
  },
  // Card detail (S14: src/features/card/CardDetailScreen.tsx).
  cardDetail: {
    title: 'カード',
    missionLabel: 'ミッション',
    missionValue: (done: number, total: number) => `${done} / ${total} 完了`,
    memoLabel: 'メモ',
    memoEmpty: 'メモはまだありません',
    editMemo: 'メモを編集',
    memoCounter: (length: number, max: number) => `${length} / ${max}`,
    saveMemo: '保存する',
    savingMemo: '保存中…',
    cancelMemo: 'キャンセル',
    memoSaved: 'メモを保存しました',
    // Keys are API error codes of PATCH /experience-cards/{cardId}, plus UNKNOWN (network,
    // server and every other error).
    memoErrors: {
      VALIDATION_ERROR: 'メモは500文字以内で入力してください',
      UNKNOWN: '保存できませんでした。もう一度お試しください。',
    },
    notFound: {
      title: 'カードが見つかりません',
      body: 'URLが正しいか、もう一度ご確認ください',
      action: 'マイページへ',
    },
    share: '共有する',
    sharePreparing: '準備中…',
    shareFailed: '共有できませんでした。もう一度お試しください。',
    // The browser refused the share sheet because the image was not ready at the tap. It is now.
    shareTapAgain: '画像の準備ができました。もう一度タップしてください',
    // Overlay with the image where the share sheet cannot take a file (S14, in-app browsers).
    sharePreview: {
      title: '共有用の画像',
      imageAlt: '思い出カードの画像',
      hint: '自動で保存されないときは、画像を長押しして保存してください',
      close: '閉じる',
    },
    // A title or venue that is too long for its line in the share image.
    shareImageCut: (text: string) => `${text}…`,
  },
  // My Page (S15: src/features/mypage/MyPageScreen.tsx).
  myPage: {
    // Screen name for screen readers in the states without the visible heading.
    screenName: 'マイページ',
    loginStatus: {
      line: 'LINEでログイン中',
      demo: 'ゲストでログイン中',
    },
    stats: {
      verified: '参加',
      complete: '完走',
      recruitment: '募集',
    },
    // Keys are API error codes of GET /me and GET /me/summary, plus UNKNOWN (network, server and
    // every other error).
    errors: {
      UNAUTHORIZED: {
        title: 'ログインが必要です',
        body: 'ログインし直してから、もう一度お試しください',
      },
      UNKNOWN: {
        title: '読み込めませんでした',
        body: '通信状態を確認して、もう一度お試しください',
      },
    },
    // One line under the heading of a section that could not load (the retry button is the
    // shared state.retry).
    sectionError: 'うまく読み込めませんでした',
    badges: {
      title: 'バッジ',
      count: (count: number) => `${count}`,
      listLabel: '手に入れたバッジ',
      empty: 'まだバッジはありません',
      // The dashed "?" at the end of the row.
      placeholder: 'まだ手に入れていないバッジ',
      // Accessible name of a badge: the event it was earned at.
      name: {
        participation: (eventTitle: string) => `${eventTitle} の参加バッジ`,
        complete: (eventTitle: string) => `${eventTitle} の完走バッジ`,
      },
      // The same without an event (it no longer exists).
      nameOnly: {
        participation: '参加バッジ',
        complete: '完走バッジ',
      },
      // The glyph text on the stamps (Figma: Shippori Mincho).
      label: {
        participation: '参加',
        complete: '完走',
      },
      placeholderMark: '?',
    },
    cards: {
      title: '思い出カード',
      showAll: 'すべて見る',
      showLess: '閉じる',
      // Accessible name of a card thumbnail (it is a link to the card).
      cardName: (eventTitle: string) => `${eventTitle} の思い出カード`,
      empty: {
        title: 'カードはまだありません',
        body: 'ミッションを終えると、ここに思い出カードが並びます',
      },
    },
    menu: {
      participations: '参加したイベント',
      recruitments: '書いた募集文',
      tickets: '予約券',
      language: '言語 · 日本語',
      logout: 'ログアウト',
    },
    // My companion record under "書いた募集文": posts I wrote and posts I joined.
    companions: {
      empty: '同行の記録はまだありません',
      // Meeting day and people: "11/28(土) ・ 2/3人".
      meta: (date: string, memberCount: number, capacity: number) =>
        `${date} ・ ${memberCount}/${capacity}人`,
      // After the line above, on a post of someone else that I joined.
      joinedSuffix: ' ・ 参加',
      // Same words as the companion screens (S06).
      status: { OPEN: '募集中', FULL: '満席', CLOSED: '締切' },
    },
    participations: {
      verified: '認証済み',
      unverified: '未認証',
      empty: '参加したイベントはまだありません',
    },
  },
  // Saved conditions, reservation tickets (S17: src/features/ticket).
  reservationTicket: {
    title: '予約券',
    description: '条件を予約しておくと、合うイベントが出たときにLINEでお知らせします',
    listLabel: '予約券の一覧',
    // Small heading on each card.
    cardLabel: '予約券',
    // Pill on a ticket whose condition has matched a new event.
    arrived: '届きました',
    savedOn: (date: string) => `${date} に保存`,
    delete: '削除',
    // Accessible name of the delete button: says which ticket it removes.
    deleteLabel: (condition: string) => `${condition} の予約券を削除`,
    deleted: '予約券を削除しました',
    deleteError: '削除できませんでした。もう一度お試しください',
    empty: {
      title: '予約券はまだありません',
      body: 'AI窓口で条件を保存すると、ここに並びます',
    },
    // Keys are API error codes of GET /saved-conditions, plus UNKNOWN (network, server and every other
    // error).
    errors: {
      UNAUTHORIZED: {
        title: 'ログインが必要です',
        body: 'ログインし直してから、もう一度お試しください',
      },
      UNKNOWN: {
        title: '読み込めませんでした',
        body: '通信状態を確認して、もう一度お試しください',
      },
    },
  },
  // The page a LINE alert opens when a new event matches a saved condition (S18:
  // src/features/notification).
  notification: {
    // Screen name for screen readers while the page is loading or failed.
    screenName: 'お知らせ',
    title: '条件に合うイベントが見つかりました',
    conditionLead: '予約していた条件',
    // The saved condition, quoted.
    condition: (condition: string) => `「${condition}」`,
    eventCardLabel: '見つかったイベント',
    viewEvent: 'イベントを見る',
    viewTickets: '予約券を見る',
    notFound: {
      title: 'お知らせが見つかりません',
      body: 'リンクが正しいか、もう一度ご確認ください',
      home: 'ホームへ',
    },
    // Keys are API error codes of GET /notifications/{id}, plus UNKNOWN (network, server and
    // every other error). NOTIFICATION_NOT_FOUND has its own block above.
    errors: {
      UNAUTHORIZED: {
        title: 'ログインが必要です',
        body: 'ログインし直してから、もう一度お試しください',
      },
      UNKNOWN: {
        title: '読み込めませんでした',
        body: '通信状態を確認して、もう一度お試しください',
      },
    },
  },
} as const
