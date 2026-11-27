import type { SVGProps } from 'react'

// Line icons of the My Page menu rows (22px, Figma ui icon style). Colored by the text color
// (currentColor). The people icon is from the Figma; the others follow its stroke style.
function MenuIcon(props: SVGProps<SVGSVGElement>) {
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
    />
  )
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MenuIcon {...props}>
      <path d="M11 8.25a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0z" />
      <path d="M3.208 17.417c.734-2.567 2.75-3.942 5.042-3.942s4.308 1.375 5.042 3.942" />
      <path d="M17.325 8.708a2.2 2.2 0 11-4.4 0 2.2 2.2 0 014.4 0z" />
      <path d="M14.667 13.383c2.016 0 3.483 1.192 4.125 3.3" />
    </MenuIcon>
  )
}

export function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MenuIcon {...props}>
      <path d="M4.5 17.5l.9-3.6 9.2-9.2a1.6 1.6 0 012.3 0l.4.4a1.6 1.6 0 010 2.3l-9.2 9.2-3.6.9z" />
      <path d="M13 6.3L15.7 9" />
    </MenuIcon>
  )
}

export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MenuIcon {...props}>
      <path d="M3.5 7.5A1.5 1.5 0 015 6h12a1.5 1.5 0 011.5 1.5v1.6a2 2 0 000 3.8v1.6A1.5 1.5 0 0117 16.5H5a1.5 1.5 0 01-1.5-1.5v-1.6a2 2 0 000-3.8V7.5z" />
      <path d="M13.5 8v1.2M13.5 10.4v1.2M13.5 12.8V14" />
    </MenuIcon>
  )
}

export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MenuIcon {...props}>
      <circle cx={11} cy={11} r={7.5} />
      <path d="M3.5 11h15" />
      <path d="M11 3.5c2.2 2.1 3.3 4.6 3.3 7.5s-1.1 5.4-3.3 7.5c-2.2-2.1-3.3-4.6-3.3-7.5S8.8 5.6 11 3.5z" />
    </MenuIcon>
  )
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <MenuIcon {...props}>
      <path d="M9 4.5H6A1.5 1.5 0 004.5 6v10A1.5 1.5 0 006 17.5h3" />
      <path d="M13 7.5l3.5 3.5-3.5 3.5M16.5 11h-8" />
    </MenuIcon>
  )
}
