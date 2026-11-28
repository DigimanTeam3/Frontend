import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_RECORDING_SECONDS = 15
// Shorter than this is almost always an accidental tap.
const MIN_RECORDING_MS = 600

export type RecorderError = 'denied' | 'unavailable' | 'tooShort'

// Android / Chrome record webm, iPhone Safari records mp4.
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

export function isRecordingSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

function pickMimeType() {
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

/**
 * Microphone recording for one question: start → stop (or 15 s) → audio Blob.
 * The stream is released as soon as recording ends, and on unmount.
 */
export function useVoiceRecorder(onRecorded: (audio: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<RecorderError | null>(null)
  // Once the microphone is refused, the screen stops offering it (text input stays).
  const [denied, setDenied] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const discardRef = useRef(false)
  const startingRef = useRef(false)
  const onRecordedRef = useRef(onRecorded)

  useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  const release = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }, [])

  const start = useCallback(async () => {
    // Ignore a second tap while the permission prompt is still open.
    if (recorderRef.current || startingRef.current) return
    startingRef.current = true
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      // Refused: stop offering the mic. No device / in use elsewhere: may work on the next try.
      const refused =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      setError(refused ? 'denied' : 'unavailable')
      if (refused) setDenied(true)
      return
    } finally {
      startingRef.current = false
    }
    // The screen was left while the permission prompt was open.
    if (discardRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const mimeType = pickMimeType()
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32_000,
      })
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      setError('unavailable')
      return
    }
    const chunks: Blob[] = []
    const startedAt = Date.now()

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      release()
      setIsRecording(false)
      setElapsed(0)
      if (discardRef.current) return
      if (Date.now() - startedAt < MIN_RECORDING_MS) {
        setError('tooShort')
        return
      }
      const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0]
      onRecordedRef.current(new Blob(chunks, { type }))
    }

    streamRef.current = stream
    recorderRef.current = recorder
    try {
      recorder.start()
    } catch {
      release()
      setError('unavailable')
      return
    }
    setIsRecording(true)
    setElapsed(0)
    timerRef.current = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(seconds)
      if (seconds >= MAX_RECORDING_SECONDS) stop()
    }, 250)
  }, [release, stop])

  // Leaving the screen mid-recording: drop the audio and free the microphone.
  useEffect(() => {
    discardRef.current = false
    return () => {
      discardRef.current = true
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      release()
    }
  }, [release])

  return { isRecording, elapsed, error, denied, clearError: () => setError(null), start, stop }
}
