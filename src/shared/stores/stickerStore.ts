import { create } from 'zustand'
import type { StickerPlacement } from '@/shared/lib/stickers'

interface StickerState {
  /** The stickers of each card (by card id) as arranged on the completion screen (S13). */
  placementsByCard: Record<number, StickerPlacement[]>
  savePlacements: (cardId: number, placements: StickerPlacement[]) => void
}

// The server has no field for the sticker placements yet, so they live here, in memory only
// (not persisted): the card detail (S14) shows what was arranged during the same session, and a
// reload goes back to the default placements.
export const useStickerStore = create<StickerState>((set) => ({
  placementsByCard: {},
  savePlacements: (cardId, placements) =>
    set((state) => ({ placementsByCard: { ...state.placementsByCard, [cardId]: placements } })),
}))
