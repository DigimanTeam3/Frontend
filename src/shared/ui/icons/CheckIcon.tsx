import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M4.167 10.417l3.75 3.75 7.916-7.917" />
    </svg>
  )
}
