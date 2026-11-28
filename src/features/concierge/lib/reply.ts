import type { ConciergeReply } from '@/shared/types/concierge'

export const MAX_TICKETS = 3

/** Ids go into in-app paths, so only positive integers are accepted. */
export const isValidId = (id: unknown): id is number => Number.isInteger(id) && (id as number) > 0

/** The recommendations a reply can show as tickets (valid ids, at most 3). */
export function validRecommendations(reply: ConciergeReply) {
  return reply.recommendations.filter((item) => isValidId(item.event?.id)).slice(0, MAX_TICKETS)
}

/** Nothing matched, or the server suggests keeping the conditions as a 予約券. */
export function offersReservation(reply: ConciergeReply) {
  return reply.kind === 'notFound' || reply.suggestTicket === true
}
