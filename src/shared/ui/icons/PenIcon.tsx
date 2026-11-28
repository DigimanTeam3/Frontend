import type { SVGProps } from 'react'

// Line icon in the stroke style of the Figma ui icon set (22px, My Page menu). Colored by the text color (currentColor); size it with a class.
export function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 22 22"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 17.5l.9-3.6 9.2-9.2a1.6 1.6 0 012.3 0l.4.4a1.6 1.6 0 010 2.3l-9.2 9.2-3.6.9z" />
      <path d="M13 6.3L15.7 9" />
    </svg>
  )
}
