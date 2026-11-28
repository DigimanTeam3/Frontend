import type { ReactNode } from 'react'

export interface SectionHeadProps {
  title: string
  /** Right side of the heading row: a count or a text button. */
  trailing?: ReactNode
}

// Heading row of a My Page section (Figma: badge head / card head, 24px high).
export function SectionHead({ title, trailing }: SectionHeadProps) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3">
      <h2 className="text-base leading-normal font-bold text-ink">{title}</h2>
      {trailing}
    </div>
  )
}
