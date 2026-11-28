/** A piece shorter than this is joined to its neighbour (too short to be worth a request). */
const CHUNK_MIN = 12
/** A sentence longer than this is cut at the last 、 before it, so its audio arrives quickly. */
const CHUNK_MAX = 120

// A sentence: text up to its end mark(s), with any closing quote; or trailing text without a mark.
const SENTENCE = /[^。！？!?]*[。！？!?]+[」』）)"']*|[^。！？!?]+/g

function cutLong(sentence: string) {
  const pieces: string[] = []
  let rest = sentence
  while (rest.length > CHUNK_MAX) {
    const comma = rest.lastIndexOf('、', CHUNK_MAX - 1)
    // No 、 to cut at: cut at the limit.
    const end = comma > 0 ? comma + 1 : CHUNK_MAX
    pieces.push(rest.slice(0, end))
    rest = rest.slice(end)
  }
  pieces.push(rest)
  return pieces
}

/**
 * Splits text into sentence-sized chunks for the server voice. Joined back together, the chunks
 * are the text (only whitespace-only chunks are dropped). No chunk is longer than
 * CHUNK_MAX + CHUNK_MIN characters.
 */
export function splitIntoChunks(text: string) {
  const chunks: string[] = []
  for (const piece of (text.match(SENTENCE) ?? []).flatMap(cutLong)) {
    const last = chunks.length - 1
    const short = piece.trim().length < CHUNK_MIN || chunks[last]?.trim().length < CHUNK_MIN
    if (last >= 0 && short && chunks[last].length + piece.length <= CHUNK_MAX + CHUNK_MIN) {
      chunks[last] += piece
    } else {
      chunks.push(piece)
    }
  }
  return chunks.filter((chunk) => chunk.trim())
}
