import { useCallback, useEffect, useState } from 'react'

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Reads replies aloud in Japanese with the browser voice. One reply at a time. */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  const cancel = useCallback(() => {
    if (!isSpeechSupported()) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [])

  const speak = useCallback((id: string, text: string) => {
    if (!isSpeechSupported()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
    if (voice) utterance.voice = voice
    utterance.onend = () => setSpeakingId((current) => (current === id ? null : current))
    utterance.onerror = utterance.onend
    setSpeakingId(id)
    window.speechSynthesis.speak(utterance)
  }, [])

  // iPhone Safari only lets speech start from a tap. Call this in the tap that ends recording,
  // so the answer that arrives seconds later can be read aloud.
  const prime = useCallback(() => {
    if (!isSpeechSupported()) return
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
  }, [])

  useEffect(() => cancel, [cancel])

  return { speakingId, speak, cancel, prime }
}
