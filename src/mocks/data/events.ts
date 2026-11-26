import type { Event } from '@/shared/types/event'

export const events: Event[] = [
  {
    id: 1,
    title: '샘플 행사: 청계천 야경 산책',
    venue_name: '청계천',
    address: '서울 종로구 서린동 14',
    start_date: '2026-11-27T18:00:00+09:00',
    end_date: '2026-12-14T22:00:00+09:00',
    image_url: null,
    latitude: 37.5692,
    longitude: 126.9784,
  },
  {
    id: 2,
    title: '샘플 행사: 신촌 거리 공연',
    venue_name: '연세로',
    address: '서울 서대문구 연세로',
    start_date: '2026-11-29T14:00:00+09:00',
    end_date: '2026-11-29T17:00:00+09:00',
    image_url: null,
    latitude: 37.5579,
    longitude: 126.9368,
  },
]
