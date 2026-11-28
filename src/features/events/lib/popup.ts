import { categoryLabel } from '@/features/events/lib/eventText'
import { ja } from '@/shared/i18n/ja'
import type { EventCategory, EventSummary } from '@/shared/types/event'

/** Home tabs and ticket colors: the API categories plus pop-up stores. */
export type HomeCategory = EventCategory | 'popup'

// The API has no category for pop-up stores: they come as `category: "exhibition"` with this
// source. A `category: "popup"` the server may add later is taken too.
const POPUP_SOURCE = 'popup_map_kr'

export function isPopup(event: Pick<EventSummary, 'category' | 'source'>) {
  return event.source === POPUP_SOURCE || (event.category as string) === 'popup'
}

/** What a ticket is printed as: pop-up stores apart from the other exhibitions. */
export function ticketCategory(event: Pick<EventSummary, 'category' | 'source'>): HomeCategory {
  return isPopup(event) ? 'popup' : event.category
}

export function homeCategoryLabel(category: HomeCategory) {
  return category === 'popup' ? ja.home.popup : categoryLabel(category)
}
