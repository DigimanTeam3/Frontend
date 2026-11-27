import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 17.5V3.75M5 4.167h8.333L11.833 7.083 13.333 10H5" />
    </svg>
  )
}
