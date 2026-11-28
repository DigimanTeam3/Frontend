import { http, HttpResponse } from 'msw/http'
import {
  addTicket,
  DELETE_ERROR_TICKET_ID,
  listTickets,
  removeTicket,
  ticketsMockMode,
} from '@/mocks/data/tickets'
import { currentUserId, errorResponse, mockDelay, unauthorizedResponse } from '@/mocks/utils'
import type { TicketCreateRequest, TicketListResponse } from '@/shared/types/ticket'

// Saved conditions mock (S17). Every call needs login (401 without it).
//
// Test hooks:
//   DELETE of ticket 9002 (the third sample) → 500 INTERNAL_ERROR
//   list and save states: see the switch in src/mocks/data/tickets.ts ('empty', 'network',
//   'server', 'create')
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

  http.post('/api/saved-conditions', async ({ request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()
    if (ticketsMockMode() === 'create') {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }

    const body = (await request.json().catch(() => null)) as Partial<TicketCreateRequest> | null
    const labelJa = typeof body?.labelJa === 'string' ? body.labelJa : ''
    const keywords = Array.isArray(body?.keywords) ? body.keywords : []
    if (labelJa.length > 120) {
      return errorResponse(422, 'VALIDATION_ERROR', 'labelJa is too long', 'labelJa')
    }
    if (keywords.length > 10 || keywords.some((keyword) => !keyword || keyword.length > 50)) {
      return errorResponse(422, 'VALIDATION_ERROR', 'keywords are not valid', 'keywords')
    }
    const ticket = addTicket({
      labelJa,
      dateFrom: body?.dateFrom ?? null,
      dateTo: body?.dateTo ?? null,
      area: body?.area ?? null,
      category: body?.category ?? null,
      companion: body?.companion ?? null,
      keywords,
      notifyLine: body?.notifyLine ?? true,
    })
    return HttpResponse.json(ticket, { status: 201 })
  }),

  http.delete('/api/saved-conditions/:ticketId', async ({ params, request }) => {
    await mockDelay()
    if (currentUserId(request) === null) return unauthorizedResponse()

    const ticketId = Number(params.ticketId)
    if (ticketId === DELETE_ERROR_TICKET_ID) {
      return errorResponse(500, 'INTERNAL_ERROR', 'mock server error')
    }
    if (!removeTicket(ticketId))
      return errorResponse(404, 'CONDITION_NOT_FOUND', 'Saved condition not found')
    return new HttpResponse(null, { status: 204 })
  }),
]
