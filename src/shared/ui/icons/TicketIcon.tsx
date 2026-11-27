import type { SVGProps } from 'react'

// Line icon in the stroke style of the Figma ui icon set (22px, My Page menu). Colored by the text color (currentColor); size it with a class.
export function TicketIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M3.5 7.5A1.5 1.5 0 015 6h12a1.5 1.5 0 011.5 1.5v1.6a2 2 0 000 3.8v1.6A1.5 1.5 0 0117 16.5H5a1.5 1.5 0 01-1.5-1.5v-1.6a2 2 0 000-3.8V7.5z" />
      <path d="M13.5 8v1.2M13.5 10.4v1.2M13.5 12.8V14" />
    </svg>
  )
}
