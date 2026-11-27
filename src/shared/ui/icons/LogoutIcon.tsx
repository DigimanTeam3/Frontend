import type { SVGProps } from 'react'

// Line icon in the stroke style of the Figma ui icon set (22px, My Page menu). Colored by the text color (currentColor); size it with a class.
export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M9 4.5H6A1.5 1.5 0 004.5 6v10A1.5 1.5 0 006 17.5h3" />
      <path d="M13 7.5l3.5 3.5-3.5 3.5M16.5 11h-8" />
    </svg>
  )
}
