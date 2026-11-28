import type { SVGProps } from 'react'

// Bottom tab icons from the Figma ui BottomNav (24px). Colored by the text color (currentColor).
function TabIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function TabTicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <TabIcon {...props}>
      <path d="M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5V10a2 2 0 000 4v2.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5V14a2 2 0 000-4V7.5z" />
      <path
        d="M14.5 6.5v.815M14.5 17.5v-.815M14.5 9.352v1.63M14.5 13.019v1.63"
        strokeWidth={1.6}
        strokeLinecap="butt"
      />
    </TabIcon>
  )
}

export function TabMapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <TabIcon {...props}>
      <path d="M9 5L4 7v12l5-2 6 2 5-2V5l-5 2-6-2z" />
      <path d="M9 5v12M15 7v12" />
    </TabIcon>
  )
}

export function TabUserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <TabIcon {...props}>
      <path d="M15.5 8.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
      <path d="M5 19.5C6.4 16.5 9 15 12 15s5.6 1.5 7 4.5" />
    </TabIcon>
  )
}
