import { useCallback, useEffect, useRef, useState } from 'react'

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Reads replies aloud in Japanese with the browser voice. One reply at a time.
 * A reply can be several parts (the answer, then each ticket's reason); `part` is the index of
 * the part being read, so the screen can point at it.
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [part, setPart] = useState(0)
  // Bumped on every speak / cancel, so callbacks of an older reply do nothing.
  const runRef = useRef(0)

  const cancel = useCallback(() => {
    if (!isSpeechSupported()) return
    runRef.current += 1
    window.speechSynthesis.cancel()
    setSpeakingId(null)
    setPart(0)
  }, [])

  const speak = useCallback((id: string, text: string | string[]) => {
    if (!isSpeechSupported()) return
    const parts = (Array.isArray(text) ? text : [text]).filter((item) => item.trim())
    window.speechSynthesis.cancel()
    const run = ++runRef.current
    if (parts.length === 0) {
      setSpeakingId(null)
      return
    }
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
    parts.forEach((item, i) => {
      const utterance = new SpeechSynthesisUtterance(item)
      utterance.lang = 'ja-JP'
      if (voice) utterance.voice = voice
      utterance.onstart = () => {
        if (runRef.current === run) setPart(i)
      }
      if (i === parts.length - 1) {
        utterance.onend = () => {
          if (runRef.current !== run) return
          setSpeakingId(null)
          setPart(0)
        }
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
    setPart(0)
    setSpeakingId(id)
  }, [])

  // iPhone Safari only lets speech start from a tap. Call this in the taps that start and end
  // recording, so the answer that arrives seconds later can be read aloud.
  const prime = useCallback(() => {
    if (!isSpeechSupported()) return
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
  }, [])

  useEffect(() => cancel, [cancel])

  return { speakingId, part, speak, cancel, prime }
}
