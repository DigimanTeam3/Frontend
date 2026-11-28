import type { SVGProps } from 'react'

// Line icon in the stroke style of the Figma ui icon set (22px, My Page menu). Colored by the text color (currentColor); size it with a class.
export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx={11} cy={11} r={7.5} />
      <path d="M3.5 11h15" />
      <path d="M11 3.5c2.2 2.1 3.3 4.6 3.3 7.5s-1.1 5.4-3.3 7.5c-2.2-2.1-3.3-4.6-3.3-7.5S8.8 5.6 11 3.5z" />
    </svg>
  )
}
