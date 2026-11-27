import { errorResponse } from '@/mocks/mockHelpers'

// Test switches of the My Page mock (S15), kept in sessionStorage so they survive a reload:
//   key MYPAGE_MOCK_KEY, JSON { "fail": ["badges", ...], "longName": true }
// "fail" makes that part answer 500 INTERNAL_ERROR: me, summary (the whole screen shows the
// error), badges, cards, participations (only that section shows its error). "longName" gives the
// user a very long nickname. The local preview has buttons for these.
export const MYPAGE_MOCK_KEY = 'digiman.mock.mypage'

export type MyPagePart = 'me' | 'summary' | 'badges' | 'cards' | 'participations'

interface MyPageMockOptions {
  fail?: MyPagePart[]
  longName?: boolean
}

function readOptions(): MyPageMockOptions {
  try {
    const stored = sessionStorage.getItem(MYPAGE_MOCK_KEY)
    return stored ? (JSON.parse(stored) as MyPageMockOptions) : {}
  } catch {
    return {}
  }
}

export function mypageLongName() {
  return readOptions().longName === true
}

/** 500 answer when the switch for this part is on, else null. */
export function mypageForcedError(part: MyPagePart) {
  return readOptions().fail?.includes(part)
    ? errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    : null
}
