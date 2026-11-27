import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set (22px, My Page menu). Colored by the text color (currentColor); size it with a class.
export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M11 8.25a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0z" />
      <path d="M3.208 17.417c.734-2.567 2.75-3.942 5.042-3.942s4.308 1.375 5.042 3.942" />
      <path d="M17.325 8.708a2.2 2.2 0 11-4.4 0 2.2 2.2 0 014.4 0z" />
      <path d="M14.667 13.383c2.016 0 3.483 1.192 4.125 3.3" />
    </svg>
  )
}
