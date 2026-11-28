import type { BadgeType } from '@/shared/types/badge'

// Every query key is built here so invalidation stays consistent.
export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: () => [...queryKeys.events.all, 'list'] as const,
    // Paged list with conditions (S02 home, S03 search). Kept apart from `list` (different data shape).
    pages: (params: object) => [...queryKeys.events.all, 'pages', params] as const,
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
  missions: {
    all: ['missions'] as const,
    // The missions of one event with my progress.
    byEvent: (eventId: number) => [...queryKeys.missions.all, 'event', eventId] as const,
  },
  badges: {
    all: ['badges'] as const,
    // My badges of one type.
    mine: (badgeType: BadgeType) => [...queryKeys.badges.all, 'mine', badgeType] as const,
  },
  cards: {
    all: ['cards'] as const,
    // My experience cards (first page).
    mine: () => [...queryKeys.cards.all, 'mine'] as const,
    detail: (cardId: number) => [...queryKeys.cards.all, 'detail', cardId] as const,
  },
  // My Page (S15). My cards use the `cards` group above.
  me: {
    all: ['me'] as const,
    profile: () => [...queryKeys.me.all, 'profile'] as const,
    summary: () => [...queryKeys.me.all, 'summary'] as const,
    // All my badges, whatever the type.
    badges: () => [...queryKeys.me.all, 'badges'] as const,
    companions: () => [...queryKeys.me.all, 'companions'] as const,
    participations: () => [...queryKeys.me.all, 'participations'] as const,
  },
  // Saved conditions (予約券, S17).
  tickets: {
    all: ['tickets'] as const,
    list: () => [...queryKeys.tickets.all, 'list'] as const,
  },
  // The page a LINE alert opens (S18).
  notifications: {
    all: ['notifications'] as const,
    detail: (notificationId: number) =>
      [...queryKeys.notifications.all, 'detail', notificationId] as const,
  },
}
