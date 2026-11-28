import { useEffect, useRef } from 'react'

// Loads the next page when the end of the list comes near the screen.
export function useNextPageTrigger(load: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadRef.current()
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}
