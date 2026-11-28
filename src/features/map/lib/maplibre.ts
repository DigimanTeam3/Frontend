import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// maplibre-gl 6 finds its worker next to its own file, which Vite moves.
// Point it at the worker file Vite emits instead. Runs once, when the first map module loads.
setWorkerUrl(workerUrl)

let webglSupport: boolean | undefined

/** WebGL is required by MapLibre. Old phones and some in-app browsers have it turned off. */
export function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas')
      webglSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

/** Camera moves jump instead of fly when the user asked the OS for less motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
