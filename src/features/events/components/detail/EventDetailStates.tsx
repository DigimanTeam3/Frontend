import { Link, useNavigate } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import { State } from '@/shared/ui/State'

export function EventDetailSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <p className="sr-only">{ja.common.loading}</p>
      <div className="h-[320px] bg-surface-2" />
      <div className="relative -mt-[30px] flex flex-col gap-5 rounded-t-3xl bg-app px-6 pt-6">
        <div className="flex gap-1.5">
          <div className="h-6 w-12 rounded-md bg-surface-2" />
          <div className="h-6 w-10 rounded-md bg-surface-2" />
        </div>
        <div className="h-8 w-3/4 rounded-lg bg-surface-2" />
        <div className="h-4 w-1/2 rounded bg-surface-2" />
        <div className="h-72 rounded-[14px] bg-surface-2" />
      </div>
    </div>
  )
}

export function EventNotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[60dvh] flex-col justify-center">
      <State
        kind="empty"
        title={ja.eventDetail.notFound}
        body={ja.eventDetail.notFoundHint}
        action={{ label: ja.notFound.backHome, onClick: () => navigate('/') }}
      />
    </div>
  )
}

export function EventLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <State kind="error" onRetry={onRetry} />
      <Link to="/" className="text-sm text-ink-muted underline underline-offset-4">
        {ja.notFound.backHome}
      </Link>
    </div>
  )
}
