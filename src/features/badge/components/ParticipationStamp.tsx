import type { CSSProperties } from 'react'
import { ja } from '@/shared/i18n/ja'
import ringImage from '@/features/badge/assets/badge-ring.png'

export interface ParticipationStampProps {
  /** "11.29": the day the badge was earned. */
  date: string
  className?: string
  style?: CSSProperties
}

// The round "ADMITTED 参加" stamp (Figma: S10 Badge, 120px). Drawn in CSS; only the dashed
// ring is a picture.
export function ParticipationStamp({ date, className, style }: ParticipationStampProps) {
  return (
    <div
      role="img"
      style={style}
      aria-label={ja.participationBadge.stampLabel(date)}
      className={`relative flex size-[120px] -rotate-10 flex-col items-center justify-center rounded-full border-[3px] border-festival bg-festival-soft text-festival ${className ?? ''}`}
    >
      <img
        src={ringImage}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-[5px] size-[104px]"
      />
      <span aria-hidden="true" className="relative flex flex-col items-center whitespace-nowrap">
        <span className="font-mono text-[8px] leading-[1.4] font-medium tracking-[0.08em]">
          {ja.participationBadge.stampCaption}
        </span>
        <span className="font-mincho text-[30px] leading-[1.3] font-extrabold tracking-[0.01em]">
          {ja.participationBadge.stampTitle}
        </span>
        <span className="font-mono text-[11px] leading-[1.4] font-medium tracking-[0.08em]">
          {date}
        </span>
      </span>
    </div>
  )
}
