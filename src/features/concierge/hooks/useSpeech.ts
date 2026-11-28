import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSpeech, SPEECH_MAX_LENGTH } from '@/features/concierge/api'

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** How long a part may keep us waiting, once it is its turn, before the browser voice takes over. */
const SERVER_PART_WAIT_MS = 4000

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

/** Resolves with the part's audio, or rejects if it is not there within `ms`. */
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
 * The server voice (natural, mp3 per part) is used first; if a part cannot be fetched in time or
 * will not play, the browser voice reads from that part to the end. Never both at once.
 * A reply can be several parts (the answer, then each ticket's reason); `part` is the index of
 * the part being read, so the screen can point at it.
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [part, setPart] = useState(0)
  // Bumped on every speak / cancel, so callbacks of an older reply do nothing.
  const runRef = useRef(0)
  // One element for every server part, so the unlock done in prime() covers all of them.
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

  /** The browser voice reads parts[from..] (indexes stay those of the whole reply). */
  const speakWithBrowser = useCallback(
    (run: number, parts: string[], from: number) => {
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
      parts.slice(from).forEach((item, offset) => {
        const i = from + offset
        const utterance = new SpeechSynthesisUtterance(item)
        utterance.lang = 'ja-JP'
        if (voice) utterance.voice = voice
        utterance.onstart = () => {
          if (runRef.current === run) setPart(i)
        }
        if (i === parts.length - 1) {
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

  /** Fetches every part at once and plays them in order; falls back to the browser voice. */
  const speakWithServer = useCallback(
    (run: number, parts: string[]) => {
      const controller = new AbortController()
      abortRef.current = controller
      const clips = parts.map((item) => fetchSpeech(item, controller.signal))
      // A part we never wait for (after a fallback or a cancel) must not report an unhandled error.
      clips.forEach((clip) => clip.catch(() => undefined))
      let switched = false

      const fallBack = (i: number) => {
        if (runRef.current !== run || switched) return
        switched = true
        stopServerVoice()
        speakWithBrowser(run, parts, i)
      }

      const playPart = async (i: number) => {
        if (runRef.current !== run || switched) return
        if (i === parts.length) {
          finish(run)
          return
        }
        let blob: Blob
        try {
          blob = await within(clips[i], SERVER_PART_WAIT_MS)
        } catch {
          fallBack(i)
          return
        }
        if (runRef.current !== run || switched) return
        const url = URL.createObjectURL(blob)
        urlsRef.current.push(url)
        const audio = audioElement()
        audio.onended = () => {
          if (runRef.current === run) void playPart(i + 1)
        }
        audio.onerror = () => fallBack(i)
        audio.src = url
        try {
          await audio.play()
        } catch {
          fallBack(i)
          return
        }
        if (runRef.current === run && !switched) setPart(i)
      }

      void playPart(0)
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
      if (serverVoiceEnabled() && parts.every((item) => item.length <= SPEECH_MAX_LENGTH)) {
        speakWithServer(run, parts)
      } else {
        speakWithBrowser(run, parts, 0)
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
