import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function WifiOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 30 30"
      width={30}
      height={30}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 11.875C7.75 9.415 11.31 8.055 15 8.055s7.25 1.36 10 3.82M8.75 16.25c1.719-1.537 3.944-2.387 6.25-2.387s4.531.85 6.25 2.387M12.5 20.5c.688-.615 1.578-.955 2.5-.955s1.813.34 2.5.955M5 5l20 20" />
    </svg>
  )
}
