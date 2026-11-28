import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSpeech, SPEECH_MAX_LENGTH } from '@/features/concierge/api'
import { splitIntoChunks } from '@/features/concierge/lib/speechChunks'

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** How long a chunk may keep us waiting, once it is its turn, before the browser voice takes over. */
const SERVER_CHUNK_WAIT_MS = 4000
/** Speech requests in flight at once. More slow each other down (measured: 3.1 s instead of 2.0 s). */
const SERVER_MAX_IN_FLIGHT = 3

/** Text to read, and the index of the reply part it belongs to. */
interface Piece {
  text: string
  part: number
}

// 1 ms of silence (WAV). Played in a tap so iPhone Safari lets the same element play later.
const SILENT_CLIP =
  'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA=='

function serverVoiceEnabled() {
  return (
    import.meta.env.VITE_SERVER_VOICE !== 'off' &&
    import.meta.env.VITE_USE_MOCK !== 'true' &&
    typeof Audio !== 'undefined'
  )
}

/** Resolves with the chunk's audio, or rejects if it is not there within `ms`. */
function within<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Reads replies aloud in Japanese. One reply at a time.
 * The server voice (natural) is used first: each part is cut into sentence-sized chunks, all are
 * fetched at once and played in order. If a chunk cannot be fetched in time or will not play, the
 * browser voice reads the rest of that part and the parts after it. Never both at once.
 * A reply can be several parts (the answer, then each ticket's reason); `part` is the index of
 * the part being read, so the screen can point at it.
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [part, setPart] = useState(0)
  // Bumped on every speak / cancel, so callbacks of an older reply do nothing.
  const runRef = useRef(0)
  // One element for every server chunk, so the unlock done in prime() covers all of them.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const urlsRef = useRef<string[]>([])

  const audioElement = useCallback(() => {
    audioRef.current ??= new Audio()
    return audioRef.current
  }, [])

  /** Stops the server voice: fetches in flight, the element, the object URLs. */
  const stopServerVoice = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    const audio = audioRef.current
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
    }
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    urlsRef.current = []
  }, [])

  const finish = useCallback(
    (run: number) => {
      if (runRef.current !== run) return
      stopServerVoice()
      setSpeakingId(null)
      setPart(0)
    },
    [stopServerVoice],
  )

  /** The browser voice reads the pieces in order, each one pointing at its part. */
  const speakWithBrowser = useCallback(
    (run: number, pieces: Piece[]) => {
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
      pieces.forEach((piece, i) => {
        const utterance = new SpeechSynthesisUtterance(piece.text)
        utterance.lang = 'ja-JP'
        if (voice) utterance.voice = voice
        utterance.onstart = () => {
          if (runRef.current === run) setPart(piece.part)
        }
        if (i === pieces.length - 1) {
          utterance.onend = () => finish(run)
        }
        // A failed part ends the whole reply (the rest would be read out of order).
        utterance.onerror = () => {
          if (runRef.current !== run) return
          runRef.current += 1
          window.speechSynthesis.cancel()
          setSpeakingId(null)
          setPart(0)
        }
        window.speechSynthesis.speak(utterance)
      })
    },
    [finish],
  )

  /**
   * Fetches the chunks in reading order, at most SERVER_MAX_IN_FLIGHT at a time, and plays them in
   * order; falls back to the browser voice.
   */
  const speakWithServer = useCallback(
    (run: number, parts: string[], chunks: Piece[]) => {
      const controller = new AbortController()
      abortRef.current = controller
      let switched = false
      const clips: Promise<Blob>[] = []
      let inFlight = 0
      let next = 0 // the first chunk whose request has not started

      const startFetch = (i: number) => {
        inFlight += 1
        const clip = fetchSpeech(chunks[i].text, controller.signal)
        clips[i] = clip
        // Also handles the error of a chunk we never wait for (after a fallback or a cancel).
        const settled = () => {
          inFlight -= 1
          startMore()
        }
        clip.then(settled, settled)
        return clip
      }
      const startMore = () => {
        if (runRef.current !== run || switched || controller.signal.aborted) return
        while (inFlight < SERVER_MAX_IN_FLIGHT && next < chunks.length) {
          if (clips[next] === undefined) startFetch(next)
          next += 1
        }
      }
      // A chunk whose turn has come is started at once, never behind later chunks.
      const clipFor = (i: number) => clips[i] ?? startFetch(i)
      startMore()

      // The browser voice reads from chunk i: the rest of its part, then the following parts.
      const fallBack = (i: number) => {
        if (runRef.current !== run || switched) return
        switched = true
        stopServerVoice()
        const { part } = chunks[i]
        const rest = chunks
          .slice(i)
          .filter((chunk) => chunk.part === part)
          .map((chunk) => chunk.text)
          .join('')
        const following = parts.slice(part + 1).map((text, offset) => ({
          text,
          part: part + 1 + offset,
        }))
        speakWithBrowser(run, [{ text: rest, part }, ...following])
      }

      const playChunk = async (i: number) => {
        if (runRef.current !== run || switched) return
        if (i === chunks.length) {
          finish(run)
          return
        }
        let blob: Blob
        try {
          blob = await within(clipFor(i), SERVER_CHUNK_WAIT_MS)
        } catch {
          fallBack(i)
          return
        }
        if (runRef.current !== run || switched) return
        const url = URL.createObjectURL(blob)
        urlsRef.current.push(url)
        const audio = audioElement()
        audio.onended = () => {
          if (runRef.current === run) void playChunk(i + 1)
        }
        audio.onerror = () => fallBack(i)
        audio.src = url
        try {
          await audio.play()
        } catch {
          fallBack(i)
          return
        }
        if (runRef.current === run && !switched) setPart(chunks[i].part)
      }

      void playChunk(0)
    },
    [audioElement, finish, speakWithBrowser, stopServerVoice],
  )

  const cancel = useCallback(() => {
    if (!isSpeechSupported()) return
    runRef.current += 1
    stopServerVoice()
    window.speechSynthesis.cancel()
    setSpeakingId(null)
    setPart(0)
  }, [stopServerVoice])

  const speak = useCallback(
    (id: string, text: string | string[]) => {
      if (!isSpeechSupported()) return
      const parts = (Array.isArray(text) ? text : [text]).filter((item) => item.trim())
      stopServerVoice()
      window.speechSynthesis.cancel()
      const run = ++runRef.current
      if (parts.length === 0) {
        setSpeakingId(null)
        return
      }
      const chunks = parts.flatMap((item, part) =>
        splitIntoChunks(item).map((chunk) => ({ text: chunk, part })),
      )
      // splitIntoChunks keeps chunks far below the limit; the check only guards against a change.
      if (serverVoiceEnabled() && chunks.every((chunk) => chunk.text.length <= SPEECH_MAX_LENGTH)) {
        speakWithServer(run, parts, chunks)
      } else {
        speakWithBrowser(
          run,
          parts.map((item, part) => ({ text: item, part })),
        )
      }
      setPart(0)
      setSpeakingId(id)
    },
    [speakWithBrowser, speakWithServer, stopServerVoice],
  )

  // iPhone Safari only lets speech and audio start from a tap. Call this in the taps that start
  // and end recording, so the answer that arrives seconds later can be read aloud.
  const prime = useCallback(() => {
    if (!isSpeechSupported()) return
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    if (!serverVoiceEnabled()) return
    const audio = audioElement()
    // A server reply in progress has the element already unlocked; its src must not change.
    if (abortRef.current || !audio.paused) return
    audio.src = SILENT_CLIP
    audio
      .play()
      .then(() => {
        // Do not pause a reply that started in the meantime.
        if (audio.src === SILENT_CLIP) audio.pause()
      })
      .catch(() => undefined)
  }, [audioElement])

  useEffect(() => cancel, [cancel])

  return { speakingId, part, speak, cancel, prime }
}
