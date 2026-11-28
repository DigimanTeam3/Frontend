import { useState, type ReactNode, type Ref } from 'react'
import { ja } from '@/shared/i18n/ja'
import lanternPhoto from '@/shared/ui/assets/ticket-lantern.svg'

export interface PolaroidCardProps {
  /** Photo in the window; null (or a URL that does not load) shows the lantern picture. */
  photoUrl: string | null
  title: string
  /** 'ko' when the title is the Korean original. */
  titleLang?: 'ko'
  /** "2026.11.29" */
  dateText: string
  venueText: string
  /** 'ko' when the venue is the Korean original. */
  venueLang?: 'ko'
  /** "No.003" */
  numberText: string
  /**
   * Drawn in a layer that covers exactly the card box (badge stickers). Position children with
   * percentages of that box; they may reach outside the card.
   */
  children?: ReactNode
  /** The card box itself, e.g. to measure it while a sticker is dragged. */
  ref?: Ref<HTMLDivElement>
  /** Extra classes on the outer box. The card is as wide as this box. */
  className?: string
}

// Polaroid experience card (Figma: ExperienceCard, 270 x 430). Shared because S13, S14 and the
// My Page thumbnails show the same card at different widths: every inner size is a share of the
// card width (cqw of the outer box), so the proportions never change.
export function PolaroidCard({
  photoUrl,
  title,
  titleLang,
  dateText,
  venueText,
  venueLang,
  numberText,
  children,
  ref,
  className,
}: PolaroidCardProps) {
  // Remembers the URL that failed, so a new photo gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = photoUrl && photoUrl !== failedUrl ? photoUrl : lanternPhoto

  return (
    // isolate: the z-order of the stickers stays inside the card (under a sticky top bar).
    <div
      ref={ref}
      className={`@container relative isolate aspect-[270/430] w-full ${className ?? ''}`}
    >
      {/* The paper has two stacked shadows: the wide soft one here, the thin one on the paper. */}
      <div className="absolute inset-0 rounded-[1.11cqw] shadow-[0_2.96cqw_3.7cqw] shadow-ink/18">
        <div className="flex size-full flex-col rounded-[1.11cqw] bg-surface px-[7.41cqw] pt-[8.89cqw] shadow-[0_0.37cqw_0.37cqw] shadow-ink/10">
          <div className="aspect-[230/310] w-full shrink-0 overflow-hidden rounded-[0.74cqw] bg-ink/5">
            {/* Portrait and landscape photos are both cropped around their centre. */}
            <img
              src={photo}
              alt=""
              draggable={false}
              onError={() => setFailedUrl(photoUrl)}
              className="size-full object-cover object-center"
            />
          </div>
          <div className="mt-[3.7cqw] flex flex-col gap-[0.74cqw] leading-[1.45]">
            <p lang={titleLang} className="truncate text-[length:5.19cqw] text-ink">
              {title}
            </p>
            <div className="flex items-center justify-between gap-[2.96cqw] whitespace-nowrap">
              <p className="min-w-0 truncate text-[length:4.07cqw] font-medium text-gate-ink">
                {ja.polaroidCard.metaBeforeVenue(dateText)}
                <span lang={venueLang}>{venueText}</span>
              </p>
              <p className="shrink-0 text-[length:3.7cqw] font-bold text-gate/40">{numberText}</p>
            </div>
          </div>
        </div>
      </div>
      {children !== undefined && <div className="absolute inset-0">{children}</div>}
    </div>
  )
}
