// Every query key is built here so invalidation stays consistent.
export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: () => [...queryKeys.events.all, 'list'] as const,
    detail: (eventId: number) => [...queryKeys.events.all, 'detail', eventId] as const,
  },
}
