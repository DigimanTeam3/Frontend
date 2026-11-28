import type { EventCategory } from '@/shared/types/event'
import { ja } from '@/shared/i18n/ja'

/** Japanese text first, original (Korean) text when there is no translation. */
export function preferJa(jaText: string | null, original: string): string
export function preferJa(jaText: string | null, original: string | null): string | null
export function preferJa(jaText: string | null, original: string | null) {
  return jaText ?? original
}

export function categoryLabel(category: EventCategory) {
  return ja.eventCategory[category]
}
