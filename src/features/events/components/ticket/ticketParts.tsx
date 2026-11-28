import { ja } from '@/shared/i18n/ja'

// Paper grain on the ticket (Figma: kippu paper texture). Pure decoration.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.12 0 0 0 0 0.13 0 0 0 0 0.19 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function PaperGrain() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: GRAIN }}
    />
  )
}

/** Vertical tear line between the ticket and its stub, with the half-circle notches. */
export function Perforation() {
  return (
    <span aria-hidden="true" className="relative w-6 shrink-0 self-stretch">
      <span className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-app" />
      <span className="absolute inset-y-3.5 left-1/2 border-l border-dashed border-ink-muted/50" />
      <span className="absolute -bottom-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-app" />
    </span>
  )
}

/** Empty punch hole on the stub: it gets punched at the venue gate (S09). */
export function PunchHole() {
  return (
    <span aria-hidden="true" className="flex flex-col items-center gap-1">
      <span className="size-8 rounded-full border-[1.2px] border-dashed border-gate" />
      <span className="font-mono text-[8px]/[1.4] tracking-[0.12em] text-gate">
        {ja.ticket.gate}
      </span>
    </span>
  )
}
