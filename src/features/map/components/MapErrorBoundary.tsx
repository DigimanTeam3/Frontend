import { Component, type ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'

interface MapErrorBoundaryProps {
  /** Size and shape of the box shown on error (same as the map's). */
  className?: string
  /** Called before the children render again, e.g. to rebuild a lazy component. */
  onRetry: () => void
  children: ReactNode
}

interface MapErrorBoundaryState {
  failed: boolean
}

/** Keeps a failed map chunk download inside the map box, with a retry button. */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true }
  }

  private retry = () => {
    this.props.onRetry()
    this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        role="alert"
        className={`flex flex-col items-center justify-center gap-3 bg-map-paper p-6 text-center ${this.props.className ?? ''}`}
      >
        <p className="text-sm text-ink">{ja.map.loadFailed}</p>
        <button
          type="button"
          onClick={this.retry}
          className="min-h-11 rounded-full border border-ink px-5 text-sm font-bold text-ink"
        >
          {ja.map.retry}
        </button>
      </div>
    )
  }
}
