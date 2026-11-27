// TODO(api): provisional — the backend spec (v2) names the paths (/saved-conditions) but the API is not built yet, so the fields are placeholders for the mock only.
import { http, HttpResponse } from 'msw/http'
import {
  DELETE_ERROR_TICKET_ID,
  listTickets,
  removeTicket,
  ticketsMockMode,
} from '@/mocks/data/tickets'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/mockHelpers'
import type { TicketListResponse } from '@/shared/types/ticket'

// Saved conditions mock (S17). Both calls need login (401 without it).
//
// Test hooks:
//   DELETE of ticket 9002 (the third sample) → 500 INTERNAL_ERROR
//   list states: see the switch in src/mocks/data/tickets.ts ('empty', 'network', 'server')
export const ticketHandlers = [
  http.get('/api/saved-conditions', async ({ request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()

    const mode = ticketsMockMode()
    if (mode === 'network') return HttpResponse.error()
    if (mode === 'server') return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')

    const body: TicketListResponse = { items: mode === 'empty' ? [] : listTickets() }
    return HttpResponse.json(body)
  }),

  http.delete('/api/saved-conditions/:ticketId', async ({ params, request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()

    const ticketId = Number(params.ticketId)
    if (ticketId === DELETE_ERROR_TICKET_ID) {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }
    if (!removeTicket(ticketId)) return errorResponse(404, 'TICKET_NOT_FOUND', 'ticket not found')
    return new HttpResponse(null, { status: 204 })
  }),
]
