/** A piece shorter than this is joined to its neighbour (too short to be worth a request). */
const CHUNK_MIN = 12
/** A sentence longer than this is cut at the last 、 before it, so its audio arrives quickly. */
const CHUNK_MAX = 120
/** The first chunk decides how soon the voice starts, so it is kept shorter. */
const FIRST_MAX = 60

// A sentence: text up to its end mark(s), with any closing quote; or trailing text without a mark.
const SENTENCE = /[^。！？!?]*[。！？!?]+[」』）)"']*|[^。！？!?]+/g

/** Length in characters (code points), so an emoji counts once and is never cut in half. */
function length(text: string) {
  return Array.from(text).length
}

/**
 * Cuts `text` after the last 、 within `max` characters. Without a 、 it cuts at `max` when `hard`,
 * otherwise it does not cut. Returns null when nothing is cut.
 */
function cut(text: string, max: number, hard: boolean): [string, string] | null {
  const chars = Array.from(text)
  if (chars.length <= max) return null
  const comma = chars.lastIndexOf('、', max - 1)
  const end = comma > 0 ? comma + 1 : hard ? max : -1
  if (end < 0) return null
  return [chars.slice(0, end).join(''), chars.slice(end).join('')]
}

function cutLong(sentence: string) {
  const pieces: string[] = []
  let rest = sentence
  for (let next = cut(rest, CHUNK_MAX, true); next; next = cut(rest, CHUNK_MAX, true)) {
    pieces.push(next[0])
    rest = next[1]
  }
  pieces.push(rest)
  return pieces
}

/**
 * Splits text into sentence-sized chunks for the server voice. Joined back together, the chunks
 * are the text (only whitespace-only chunks are dropped). The first chunk is at most FIRST_MAX
 * characters when the first sentence has a 、 to cut at; no chunk is longer than
 * CHUNK_MAX + CHUNK_MIN characters.
 */
export function splitIntoChunks(text: string) {
  const sentences = text.match(SENTENCE) ?? []
  const first = sentences[0]
  const opening = first === undefined ? null : cut(first, FIRST_MAX, false)
  if (opening) sentences.splice(0, 1, ...opening)
  const chunks: string[] = []
  for (const piece of sentences.flatMap(cutLong)) {
    const last = chunks.length - 1
    const short = piece.trim().length < CHUNK_MIN || chunks[last]?.trim().length < CHUNK_MIN
    const limit = last === 0 ? FIRST_MAX : CHUNK_MAX + CHUNK_MIN
    if (last >= 0 && short && length(chunks[last]) + length(piece) <= limit) {
      chunks[last] += piece
    } else {
      chunks.push(piece)
    }
  }
  return chunks.filter((chunk) => chunk.trim())
}
