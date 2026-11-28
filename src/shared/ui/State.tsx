import type { ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'
import { Button } from '@/shared/ui/Button'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { WifiOffIcon } from '@/shared/ui/icons/WifiOffIcon'

export interface StateAction {
  label: string
  onClick: () => void
}

interface StateBaseProps {
  /** Extra classes on the outer box, e.g. "my-auto" to center it in a full-height screen. */
  className?: string
}

export type StateProps =
  | (StateBaseProps & { kind: 'loading' })
  | (StateBaseProps & {
      kind: 'empty'
      title: string
      body?: string
      /** Replaces the default search icon (30px line icon). */
      icon?: ReactNode
      action?: StateAction
    })
  | (StateBaseProps & {
      kind: 'error'
      /** Defaults to the shared "could not load" copy. */
      title?: string
      body?: string
      icon?: ReactNode
      /** Shows the shared retry button. Ignored when `action` is given. */
      onRetry?: () => void
      action?: StateAction
    })

// Loading, empty and error in one shape for every screen (Figma: ui / State, C9).
// Put it inside a list, or center it in the screen with className="my-auto".
export function State(props: StateProps) {
  if (props.kind === 'loading') return <LoadingState className={props.className} />

  const isError = props.kind === 'error'
  const title = isError ? (props.title ?? ja.state.errorTitle) : props.title
  const body = isError ? (props.body ?? ja.state.errorBody) : props.body
  const action =
    props.action ??
    (isError && props.onRetry ? { label: ja.common.retry, onClick: props.onRetry } : undefined)

  return (
    <div
      role={isError ? 'alert' : undefined}
      className={`flex w-full flex-col items-center gap-3 px-6 py-8 text-center ${props.className ?? ''}`}
    >
      <div
        className={`flex size-16 shrink-0 items-center justify-center rounded-full ${
          isError ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-ink-muted'
        }`}
      >
        {props.icon ?? (isError ? <WifiOffIcon /> : <SearchIcon />)}
      </div>
      <p className="text-base leading-normal font-bold text-ink">{title}</p>
      {body && <p className="text-[13px] leading-[1.6] text-ink-muted">{body}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

function LoadingState({ className }: { className?: string }) {
  return (
    // No aria-busy here: a region that stays busy may never be announced by screen readers.
    <div
      role="status"
      className={`flex w-full flex-col gap-3 motion-safe:animate-pulse ${className ?? ''}`}
    >
      <span className="sr-only">{ja.common.loading}</span>
      {[0, 1].map((card) => (
        <div key={card} aria-hidden="true" className="flex flex-col gap-2.5">
          <div className="h-[150px] w-full rounded-[14px] bg-ink/5" />
          <div className="h-4 w-[220px] max-w-full rounded-md bg-ink/5" />
          <div className="h-3 w-[150px] max-w-full rounded-md bg-ink/5" />
        </div>
      ))}
    </div>
  )
}
