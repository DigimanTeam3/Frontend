// TODO(api): provisional — the backend spec (v2) names the paths (/saved-conditions) but the API is not built yet, so the fields are placeholders for the mock only.
import type { Ticket } from '@/shared/types/ticket'

// Saved conditions of the mock user, in memory (a reload brings the three samples back). The copy
// is taken from the Figma "S17 切符入れ（予約券）".

/** The ticket whose DELETE always fails with 500, so the failure path can be tried. */
export const DELETE_ERROR_TICKET_ID = 9002

const samples: Ticket[] = [
  {
    id: 1,
    condition: '週末・屋内・一人でも',
    labels: ['週末', '屋内', '一人でも'],
    createdAt: '2026-11-20T10:00:00+09:00',
    matched: true,
  },
  {
    id: 2,
    condition: '夜・展示・友だちと',
    labels: ['夜', '展示', '友だちと'],
    createdAt: '2026-11-18T21:30:00+09:00',
    matched: false,
  },
  {
    // Its id makes DELETE fail (see DELETE_ERROR_TICKET_ID).
    id: DELETE_ERROR_TICKET_ID,
    condition: '平日・公演',
    labels: ['平日', '公演'],
    createdAt: '2026-11-10T09:00:00+09:00',
    matched: false,
  },
]

let tickets: Ticket[] = samples.map((ticket) => ({ ...ticket, labels: [...ticket.labels] }))

export function listTickets() {
  return tickets
}

/** True when a ticket was removed. */
export function removeTicket(ticketId: number) {
  const before = tickets.length
  tickets = tickets.filter((ticket) => ticket.id !== ticketId)
  return tickets.length < before
}

// Switch for the list screen states, kept in sessionStorage so a reload keeps it. The local
// preview sets it; delete the key (or call setTicketsMockMode(null)) for the normal list.
//   'empty'    GET answers an empty list
//   'network'  GET fails without any answer
//   'server'   GET answers 500 INTERNAL_ERROR
export const TICKETS_MOCK_KEY = 'digiman.ticketsMock'
export type TicketsMockMode = 'empty' | 'network' | 'server'

export function ticketsMockMode(): TicketsMockMode | null {
  const value = sessionStorage.getItem(TICKETS_MOCK_KEY)
  return value === 'empty' || value === 'network' || value === 'server' ? value : null
}

export function setTicketsMockMode(mode: TicketsMockMode | null) {
  if (mode) sessionStorage.setItem(TICKETS_MOCK_KEY, mode)
  else sessionStorage.removeItem(TICKETS_MOCK_KEY)
}
