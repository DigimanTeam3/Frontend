// Every query key is built here so invalidation stays consistent.
export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: () => [...queryKeys.events.all, 'list'] as const,
    detail: (eventId: number) => [...queryKeys.events.all, 'detail', eventId] as const,
  },
  participations: {
    all: ['participations'] as const,
    // My participation in one event (null in the cache = I have none yet).
    byEvent: (eventId: number) => [...queryKeys.participations.all, 'event', eventId] as const,
  },
}
