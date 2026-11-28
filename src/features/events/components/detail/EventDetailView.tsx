import { useState } from 'react'
import { Link } from 'react-router'
import chevronIcon from '@/features/events/assets/chevron.svg'
import globeIcon from '@/features/events/assets/globe.svg'
import { EventHero } from '@/features/events/components/detail/EventHero'
import { EventInfoTicket } from '@/features/events/components/detail/EventInfoTicket'
import { EventTags } from '@/features/events/components/detail/EventTags'
import { ja } from '@/shared/i18n/ja'
import type { EventDetail } from '@/shared/types/event'

export function EventDetailView({ event }: { event: EventDetail }) {
  const t = ja.eventDetail
  const hasTranslation = event.titleJa !== null
  const [showOriginal, setShowOriginal] = useState(false)

  const pick = (jaText: string | null, original: string | null) =>
    showOriginal ? original : (jaText ?? original)
  const titleIsOriginal = showOriginal || event.titleJa === null
  const title = titleIsOriginal ? event.title : event.titleJa

  return (
    <article>
      <EventHero imageUrl={event.imageUrl} shareTitle={title ?? event.title} />

      <div className="relative -mt-[30px] flex flex-col gap-5 rounded-t-3xl bg-app px-6 pt-6 pb-44">
        <EventTags event={event} />

        <header className="flex flex-col gap-1">
          <h1 lang={titleIsOriginal ? 'ko' : undefined} className="text-[22px]/[1.4] font-bold">
            {title}
          </h1>
          <p className="flex flex-wrap items-center gap-1.5 text-xs/normal text-ink-muted">
            {hasTranslation && !showOriginal && (
              <span lang="ko" className="text-[13px]/[1.6]">
                {event.title}
              </span>
            )}
            <img src={globeIcon} alt="" width={14} height={14} />
            {hasTranslation ? (
              <>
                {!showOriginal && <span>{t.autoTranslated} ·</span>}
                <button
                  type="button"
                  onClick={() => setShowOriginal((value) => !value)}
                  className="underline-offset-2 active:underline"
                >
                  {showOriginal ? t.showJapanese : t.showOriginal}
                </button>
              </>
            ) : (
              <span>{t.noTranslation}</span>
            )}
          </p>
        </header>

        <EventInfoTicket event={event} pick={pick} />

        <section className="flex flex-col gap-2">
          <h2 className="text-lg/[1.45] font-bold">{t.about}</h2>
          <p className="text-[15px]/[1.65] whitespace-pre-line">
            {pick(event.descriptionJa, event.description)}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <Link to={`/events/${event.id}/companions`} className="flex items-center gap-1">
            <h2 className="flex-1 text-lg/[1.45] font-bold">{t.companions}</h2>
            <span className="text-[13px]/[1.6] text-ink-muted">
              {t.companionCount(event.companionCount)}
            </span>
            <img src={chevronIcon} alt="" width={16} height={16} />
          </Link>
          {event.companionCount === 0 && (
            <p className="rounded-[14px] border border-dashed border-line px-4 py-3 text-[13px]/[1.6] text-ink-muted">
              {t.noCompanions}
            </p>
          )}
        </section>
      </div>
    </article>
  )
}
