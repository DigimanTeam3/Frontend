import type { EventCategory } from '@/shared/types/event'

// Ticket paper and print colors per category (Figma: Concept 切符 / kippu category colors).
// Full class names so Tailwind can find them.
export const TICKET_COLORS: Record<
  EventCategory,
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
}
