import type { HomeCategory } from '@/features/events/lib/popup'

// Ticket paper and print colors per category (Figma: Concept 切符 / kippu category colors).
// Full class names so Tailwind can find them.
export const TICKET_COLORS: Record<
  HomeCategory,
  { paper: string; text: string; border: string; bar: string }
> = {
  festival: {
    paper: 'bg-kippu-festival-paper',
    text: 'text-kippu-festival',
    border: 'border-kippu-festival',
    bar: 'bg-kippu-festival',
  },
  exhibition: {
    paper: 'bg-kippu-exhibit-paper',
    text: 'text-kippu-exhibit',
    border: 'border-kippu-exhibit',
    bar: 'bg-kippu-exhibit',
  },
  performance: {
    paper: 'bg-kippu-stage-paper',
    text: 'text-kippu-stage',
    border: 'border-kippu-stage',
    bar: 'bg-kippu-stage',
  },
  // Pop-up stores: the gate pink (filled pink for decoration, the darker ink for text).
  popup: {
    paper: 'bg-gate-soft',
    text: 'text-gate-ink',
    border: 'border-gate-ink',
    bar: 'bg-gate',
  },
}
