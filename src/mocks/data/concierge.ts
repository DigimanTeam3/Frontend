import type {
  ConciergeConditions,
  ConciergeEventSummary,
  ConciergeMessageRequest,
  ConciergeRecommendation,
  ConciergeReply,
} from '@/shared/types/concierge'

// Events the mock concierge recommends. Same ids and values as the S05 event mock,
// so the detail links open the same events.
const lantern: ConciergeEventSummary = {
  id: 1,
  title: '서울빛초롱축제',
  titleJa: 'ソウル光の提灯祭り',
  category: 'festival',
  startDate: '2026-11-01T17:00:00+09:00',
  endDate: '2026-11-30T23:00:00+09:00',
  venueName: '청계천 광장',
  venueNameJa: '清渓川広場（チョンゲチョン）',
  lat: 37.5692,
  lng: 126.9784,
  imageUrl: null,
  isFree: true,
  companionCount: 3,
}

const busking: ConciergeEventSummary = {
  id: 2,
  title: '신촌 거리 공연',
  titleJa: '新村ストリートライブ',
  category: 'performance',
  startDate: '2026-11-29T14:00:00+09:00',
  endDate: '2026-11-29T17:00:00+09:00',
  venueName: '연세로',
  venueNameJa: '延世路（ヨンセロ）',
  lat: 37.5579,
  lng: 126.9368,
  imageUrl: null,
  isFree: true,
  companionCount: 0,
}

const craftMuseum: ConciergeEventSummary = {
  id: 3,
  title: '서울공예박물관 특별전',
  titleJa: 'ソウル工芸博物館 特別展',
  category: 'exhibition',
  startDate: '2026-12-05T10:00:00+09:00',
  endDate: '2027-02-28T18:00:00+09:00',
  venueName: '서울공예박물관',
  venueNameJa: 'ソウル工芸博物館',
  lat: 37.5763,
  lng: 126.9851,
  imageUrl: null,
  isFree: false,
  companionCount: 1,
}

// No Japanese title: the ticket shows the original text with 「日本語訳なし」.
const fleaMarket: ConciergeEventSummary = {
  id: 4,
  title: '망원 한강공원 플리마켓',
  titleJa: null,
  category: 'festival',
  startDate: '2026-11-28T11:00:00+09:00',
  endDate: '2026-11-29T17:00:00+09:00',
  venueName: '망원한강공원',
  venueNameJa: null,
  lat: 37.5552,
  lng: 126.8956,
  imageUrl: null,
  isFree: true,
  companionCount: 2,
}

const EMPTY_CONDITIONS: ConciergeConditions = {
  dateFrom: null,
  dateTo: null,
  area: null,
  category: null,
  companion: null,
  keywords: [],
}

const WEEKEND = { dateFrom: '2026-11-28', dateTo: '2026-11-29' }

const rec = (event: ConciergeEventSummary, reason: string): ConciergeRecommendation => ({
  event,
  reason,
})

const DATE_WORDS = /今日|今夜|今晩|週末|土曜|日曜|来週|明日|いつでも|雨/

/**
 * Mock concierge. Picks a canned reply from words in the question so every screen state
 * can be reached:
 * - 「スキー」 → notFound (予約券 offer)
 * - no date word and no earlier conditions → clarify (asks when)
 * - 「土曜」 → narrows to Saturday, 「今夜」 → night events, 「雨」 → indoor exhibition
 * - 「一緒」 → events with companion posts
 * - otherwise → this weekend, alone-friendly (the demo question)
 */
export function mockConciergeReply({ text, conditions }: ConciergeMessageRequest): ConciergeReply {
  const base = conditions ?? EMPTY_CONDITIONS

  if (text.includes('スキー')) {
    return {
      kind: 'notFound',
      reply:
        'ごめんなさい、ソウル市内でスキーの無料イベントは見つかりませんでした。\n条件を予約券にしておけば、見つかったときにLINEでお知らせします。',
      recommendations: [],
      suggestions: ['今週末のおすすめ', '雨でも楽しめるもの'],
      conditions: { ...base, keywords: ['スキー'] },
    }
  }

  if (!DATE_WORDS.test(text) && !base.dateFrom) {
    return {
      kind: 'clarify',
      reply: 'いいですね！いつ行く予定ですか？',
      recommendations: [],
      suggestions: ['今日', '今週末', '来週', 'いつでも'],
      conditions: base,
    }
  }

  if (text.includes('土曜')) {
    return {
      kind: 'answer',
      reply: '土曜日（11/28）だけに絞りました。昼のマーケットと夜の提灯、どちらも一人で回れます。',
      recommendations: [
        rec(fleaMarket, '漢江沿いの屋外マーケット。一人でもふらっと立ち寄れます。'),
        rec(lantern, '夜は提灯が灯ります。マーケットの帰りに寄れる距離です。'),
      ],
      suggestions: ['日曜日も見たい', '一緒に行く人も探したい'],
      conditions: { ...base, dateFrom: '2026-11-28', dateTo: '2026-11-28' },
    }
  }

  if (/今夜|今晩/.test(text)) {
    return {
      kind: 'answer',
      reply: '今夜（11/27）行ける無料イベントはこちらです。23時まで開いています。',
      recommendations: [rec(lantern, '17時から23時まで。夜がいちばんきれいに見えます。')],
      suggestions: ['今週末も見たい', '一緒に行く人も探したい'],
      conditions: { ...base, dateFrom: '2026-11-27', dateTo: '2026-11-27' },
    }
  }

  if (text.includes('雨')) {
    return {
      kind: 'answer',
      reply: '雨の日は屋内の展示がおすすめです。こちらは入場料が必要なのでご注意ください。',
      recommendations: [rec(craftMuseum, '屋内なので天気を気にせず、ゆっくり見られます。')],
      suggestions: ['無料のものだけ', '今週末のおすすめ'],
      conditions: { ...base, category: 'exhibition', keywords: ['屋内'] },
    }
  }

  if (text.includes('一緒')) {
    return {
      kind: 'answer',
      reply:
        '同行者を募集しているイベントを選びました。切符の「同行者を探す」から募集を見られます。',
      recommendations: [
        rec(lantern, '3件の同行募集があります。夜のお散歩仲間が見つかりそうです。'),
        rec(fleaMarket, '2件の同行募集があります。昼から一緒に回れます。'),
      ],
      suggestions: ['土曜日だけ', '夜に行けるもの'],
      conditions: { ...base, companion: 'group' },
    }
  }

  return {
    kind: 'answer',
    reply: '今週末（11/28〜11/29）、一人でも気軽に行ける無料イベントを3つ選びました。',
    recommendations: [
      rec(lantern, '川沿いを歩きながら見る提灯なので、一人でも自分のペースで楽しめます。'),
      rec(busking, '路上ライブは出入り自由。好きな時間だけ聴いて帰れます。'),
      rec(fleaMarket, '漢江沿いのマーケット。地元の雰囲気を気軽に味わえます。'),
    ],
    suggestions: ['土曜日だけ', '今夜行けるもの', '一緒に行く人も探したい'],
    conditions: { ...base, ...WEEKEND, companion: 'alone' },
  }
}

/** What the mock speech recognition always "hears". */
export const MOCK_TRANSCRIPT = '今週末、一人でも行けるイベントある？'
