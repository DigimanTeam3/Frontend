// Route paths in one place, so screens link by name instead of by string.
// Keep in sync with the route list in src/app/router.tsx.
export const paths = {
  home: () => '/',
  login: () => '/login',
  map: () => '/map',
  eventDetail: (eventId: number) => `/events/${eventId}`,
  checkIn: (eventId: number) => `/events/${eventId}/check-in`,
  badge: (eventId: number) => `/events/${eventId}/badge`,
  missions: (eventId: number) => `/events/${eventId}/missions`,
  missionSubmit: (eventId: number, missionId: number) => `/events/${eventId}/missions/${missionId}`,
  complete: (eventId: number) => `/events/${eventId}/complete`,
  cardDetail: (cardId: number) => `/cards/${cardId}`,
  me: () => '/me',
  tickets: () => '/me/tickets',
  notification: (notificationId: number) => `/notifications/${notificationId}`,
}

/** Number in a route param ("12" → 12), or null when it is not a positive whole number. */
export function parseIdParam(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
