// Splits Hangul syllables into their letters (jamo) for the home ticket title animation.
const FIRST = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const MIDDLE = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const LAST = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']

const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3

/** 「빛」 → ["ㅂ", "ㅣ", "ㅊ"]. Anything that is not a Hangul syllable comes back as is (spaces as []). */
export function splitJamo(char: string): string[] {
  const code = char.codePointAt(0) ?? 0
  if (code < SYLLABLE_START || code > SYLLABLE_END) return char.trim() ? [char] : []
  const index = code - SYLLABLE_START
  const first = FIRST[Math.floor(index / 588)]
  const middle = MIDDLE[Math.floor((index % 588) / 28)]
  const last = LAST[index % 28]
  return last ? [first, middle, last] : [first, middle]
}
