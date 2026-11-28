import { create } from 'zustand'
import type { StickerPlacement } from '@/shared/lib/stickers'

interface StickerState {
  /** The stickers of each card (by card id) as arranged on the completion screen (S13). */
  placementsByCard: Record<number, StickerPlacement[]>
  savePlacements: (cardId: number, placements: StickerPlacement[]) => void
}

// What was arranged in this session, in memory only. The arrangement itself is saved on the
// card (`stickerPlacements`); this copy shows it at once, also when that save has not answered
// yet or has failed.
export const useStickerStore = create<StickerState>((set) => ({
  placementsByCard: {},
  savePlacements: (cardId, placements) =>
    set((state) => ({ placementsByCard: { ...state.placementsByCard, [cardId]: placements } })),
}))
