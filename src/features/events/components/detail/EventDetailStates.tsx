import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'

export function EventDetailSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <p className="sr-only">{ja.common.loading}</p>
      <div className="h-[320px] bg-line" />
      <div className="relative -mt-[30px] flex flex-col gap-5 rounded-t-3xl bg-bg px-6 pt-6">
        <div className="flex gap-1.5">
          <div className="h-6 w-12 rounded-md bg-line" />
          <div className="h-6 w-10 rounded-md bg-line" />
        </div>
        <div className="h-8 w-3/4 rounded-lg bg-line" />
        <div className="h-4 w-1/2 rounded bg-line" />
        <div className="h-72 rounded-[14px] bg-line" />
      </div>
    </div>
  )
}

export function EventNotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-lg font-bold">{ja.eventDetail.notFound}</h1>
      <p className="text-sm text-ink-sub">{ja.eventDetail.notFoundHint}</p>
      <Link
        to="/"
        className="mt-4 rounded-[14px] border border-line bg-surface px-5 py-3 text-[15px] font-bold"
      >
        {ja.notFound.backHome}
      </Link>
    </div>
  )
}

export function EventLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <p className="text-sm text-danger">{ja.common.error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-[14px] bg-ink px-5 py-3 text-[15px] font-bold text-surface"
      >
        {ja.eventDetail.retry}
      </button>
      <Link to="/" className="mt-2 text-sm text-ink-sub underline">
        {ja.notFound.backHome}
      </Link>
    </div>
  )
}
