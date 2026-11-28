import { ja } from '@/shared/i18n/ja'
import type { Ticket, TicketCreateRequest } from '@/shared/types/ticket'

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

// 「2026-11-28」 → 「11/28」
function monthDay(day: string) {
  const [, month, date] = day.split('-')
  return `${Number(month)}/${Number(date)}`
}

/** Saves a new ticket at the top of the list. The chips are built the way the server builds them. */
export function addTicket(request: TicketCreateRequest): Ticket {
  const first = request.dateFrom ?? request.dateTo
  const last = request.dateTo ?? request.dateFrom
  const labels = [
    first && last
      ? first === last
        ? monthDay(first)
        : `${monthDay(first)}〜${monthDay(last)}`
      : '',
    request.area ? ja.search.areas[request.area] : '',
    request.category ? ja.eventCategory[request.category] : '',
    request.companion ? ja.reservationTicket.companion[request.companion] : '',
    ...request.keywords,
  ].filter(Boolean)
  const ticket: Ticket = {
    // Below 9000: those ids are test hooks (see DELETE_ERROR_TICKET_ID).
    id: Math.max(0, ...tickets.map((item) => item.id).filter((id) => id < 9000)) + 1,
    condition: request.labelJa,
    labels,
    createdAt: `${new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19)}+09:00`,
    matched: false,
  }
  tickets = [ticket, ...tickets]
  return ticket
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
//   'create'   POST answers 500 INTERNAL_ERROR (the list itself is normal)
export const TICKETS_MOCK_KEY = 'digiman.ticketsMock'
export type TicketsMockMode = 'empty' | 'network' | 'server' | 'create'

export function ticketsMockMode(): TicketsMockMode | null {
  const value = sessionStorage.getItem(TICKETS_MOCK_KEY)
  return value === 'empty' || value === 'network' || value === 'server' || value === 'create'
    ? value
    : null
}

export function setTicketsMockMode(mode: TicketsMockMode | null) {
  if (mode) sessionStorage.setItem(TICKETS_MOCK_KEY, mode)
  else sessionStorage.removeItem(TICKETS_MOCK_KEY)
}
