import type { BadgeType } from '@/shared/types/badge'

// Every query key is built here so invalidation stays consistent.
export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: () => [...queryKeys.events.all, 'list'] as const,
    detail: (eventId: number) => [...queryKeys.events.all, 'detail', eventId] as const,
  },
  companions: {
    all: ['companions'] as const,
    lists: () => [...queryKeys.companions.all, 'list'] as const,
    // signedIn is part of the key: the list says which posts are mine, so it differs after login.
    list: (eventId: number, filter: string, signedIn: boolean) =>
      [...queryKeys.companions.lists(), eventId, filter, signedIn] as const,
  },
  // The event as the journey screens read it (S09–S13): only a few fields of the event detail,
  // so it must not share the cache entry of `events.detail`, which holds the full shape.
  journeyEvents: {
    all: ['journeyEvents'] as const,
    detail: (eventId: number) => [...queryKeys.journeyEvents.all, 'detail', eventId] as const,
  },
  participations: {
    all: ['participations'] as const,
    // My participation in one event (null in the cache = I have none yet).
    byEvent: (eventId: number) => [...queryKeys.participations.all, 'event', eventId] as const,
  },
  badges: {
    all: ['badges'] as const,
    // My badges of one type.
    mine: (badgeType: BadgeType) => [...queryKeys.badges.all, 'mine', badgeType] as const,
  },
}
