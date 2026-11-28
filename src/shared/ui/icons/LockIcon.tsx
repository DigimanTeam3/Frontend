import type { SVGProps } from 'react'

// Line icon from the Figma ui icon set. Colored by the text color (currentColor); size it with a class.
export function LockIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M6.25 8.75h7.5c.92 0 1.667.746 1.667 1.667v4.166c0 .92-.746 1.667-1.667 1.667h-7.5c-.92 0-1.667-.746-1.667-1.667v-4.166c0-.92.746-1.667 1.667-1.667z" />
      <path d="M7.083 8.75V6.667a2.917 2.917 0 015.834 0V8.75" />
    </svg>
  )
}
