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
}
