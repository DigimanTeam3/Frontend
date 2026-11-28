import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 28 28"
      width={28}
      height={28}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 24.5s7-6.533 7-12.833a7 7 0 10-14 0C7 17.967 14 24.5 14 24.5z" />
      <circle cx="14" cy="11.667" r="2.567" />
    </svg>
  )
}
