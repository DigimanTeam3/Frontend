import type { ReactNode } from 'react'
import { ja } from '@/shared/i18n/ja'

interface TicketCardProps {
  className: string
  photo: ReactNode
  children?: ReactNode
}

// Photo areas are color placeholders until real event images are wired in.
function TicketCard({ className, photo, children }: TicketCardProps) {
  return (
    <div className={`absolute overflow-hidden rounded-2xl bg-surface shadow-xl ${className}`}>
      <div className="relative h-36 overflow-hidden">{photo}</div>
      <div className="border-t-2 border-dashed border-line px-3 pt-3 pb-4">{children}</div>
    </div>
  )
}

const bokeh = [
  'top-4 left-6 size-6',
  'top-10 left-24 size-3',
  'top-6 right-8 size-8',
  'top-20 left-10 size-4',
  'top-24 right-16 size-5',
  'top-28 left-32 size-3',
]

/** Three tilted tickets (S01 hero). Decorative only. */
export function LoginHero() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[22rem] w-full max-w-[360px]">
      <TicketCard
        className="top-14 left-0 w-44 -rotate-12"
        photo={<div className="h-full bg-linear-to-br from-slate-500 to-slate-700" />}
      />
      <TicketCard
        className="top-0 right-0 w-44 rotate-6"
        photo={<div className="h-full bg-radial from-lime-100 via-emerald-700 to-emerald-950" />}
      />
      <TicketCard
        className="top-24 left-1/2 w-52 -translate-x-1/2 -rotate-3"
        photo={
          <div className="h-full bg-linear-to-b from-rose-950 to-orange-900">
            {bokeh.map((position) => (
              <span
                key={position}
                className={`absolute rounded-full bg-amber-300/60 blur-[1px] ${position}`}
              />
            ))}
          </div>
        }
      >
        <p className="font-bold text-ink">{ja.login.sampleTitle}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{ja.login.sampleOriginal}</p>
        <p className="mt-2 font-mono text-xs tracking-widest text-gate">
          {ja.login.samplePrice}　{ja.login.sampleFree}
        </p>
      </TicketCard>
    </div>
  )
}
