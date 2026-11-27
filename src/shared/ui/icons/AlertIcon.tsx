import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function AlertIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="7.333" />
      <path d="M11 7.333v4.584M11 14.667v.183" />
    </svg>
  )
}
