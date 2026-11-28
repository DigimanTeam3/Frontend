import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useTicketsQuery,
} from '@/features/ticket/api'
import { TicketCard } from '@/features/ticket/components/TicketCard'
import {
  clearTicketDraft,
  readTicketDraft,
  toTicketRequest,
} from '@/features/ticket/lib/ticketDraft'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/api/errors'
import { State } from '@/shared/ui/State'
import { Toast } from '@/shared/ui/Toast'
import type { Ticket, TicketCreateRequest } from '@/shared/types/ticket'

// S17 saved conditions (page /me/tickets, API /saved-conditions, Figma: S17 切符入れ（予約券）):
// the search conditions saved from the AI concierge, with delete. The swipe gesture of the design
// is a plain button for now. Coming from 「この条件で予約券をつくる」 of the AI concierge (S16), the
// conditions it handed over are saved as a new ticket here.
export function TicketsScreen() {
  const { reservationTicket: copy } = ja
  const ticketsQuery = useTicketsQuery()
  const deleteMutation = useDeleteTicketMutation()
  const { mutateAsync: postTicket, isPending: isCreating } = useCreateTicketMutation()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  // The ticket to make from the conditions the AI concierge handed over. Stays until it is saved,
  // so a failed save can be tried again.
  const [draft, setDraft] = useState(() => toTicketRequest(readTicketDraft(location.state)))
  const [createFailed, setCreateFailed] = useState(false)
  const saveStarted = useRef(false)
  // The tickets whose delete failed. Kept per ticket, so a delete of another ticket that starts
  // or succeeds meanwhile does not take the alert away.
  const [failedIds, setFailedIds] = useState<number[]>([])

  const tickets = ticketsQuery.data?.items
  // Only for tickets still in the list: one that is gone after a refetch (deleted elsewhere)
  // cannot be tried again, so its alert would stay forever.
  const deleteFailed = failedIds.some((id) => tickets?.some((ticket) => ticket.id === id))

  // The handed-over conditions are read once (above) and taken away here, from the storage and
  // from the router state, so a reload or coming back to this page does not make the same ticket
  // again.
  useEffect(() => {
    clearTicketDraft()
    if (location.state !== null) {
      void navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: null },
      )
    }
  }, [location, navigate])

  // Saves the handed-over conditions as a ticket. A ticket with the same condition is not made
  // twice: the button of the AI concierge can be pressed again for the same conditions, and a
  // save whose answer was lost may have reached the server.
  const saveDraft = useCallback(
    async (request: TicketCreateRequest, existing: Ticket[]) => {
      if (existing.some((ticket) => ticket.condition === request.labelJa)) {
        setDraft(null)
        setToast(copy.alreadyExists)
        return
      }
      setCreateFailed(false)
      try {
        await postTicket(request)
        setDraft(null)
        setToast(copy.created)
      } catch {
        setCreateFailed(true)
      }
    },
    [postTicket, copy],
  )

  // Starts the save once, when the list is on screen.
  useEffect(() => {
    if (!draft || !tickets || saveStarted.current) return
    saveStarted.current = true
    void saveDraft(draft, tickets)
  }, [draft, tickets, saveDraft])

  // mutateAsync, not mutate with callbacks: those only fire for the newest delete, so with two
  // quick deletes the result of the first one would be lost.
  async function deleteTicket(ticketId: number) {
    // A new try takes back the failure of this ticket only.
    setFailedIds((ids) => ids.filter((id) => id !== ticketId))
    try {
      await deleteMutation.mutateAsync(ticketId)
      setToast(copy.deleted)
    } catch {
      setFailedIds((ids) => [...ids, ticketId])
    }
  }

  let content
  if (tickets) {
    // Checked before the error state: a failed background refetch must not close a list that is
    // already on screen.
    content =
      tickets.length === 0 ? (
        <State kind="empty" title={copy.empty.title} body={copy.empty.body} className="my-auto" />
      ) : (
        <ul aria-label={copy.listLabel} className="flex flex-col gap-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onDelete={(ticketId) => void deleteTicket(ticketId)}
            />
          ))}
        </ul>
      )
  } else if (ticketsQuery.isError) {
    const code = apiErrorCode(ticketsQuery.error)
    const errorCopy = code === 'UNAUTHORIZED' ? copy.errors.UNAUTHORIZED : copy.errors.UNKNOWN
    content = (
      <State
        kind="error"
        title={errorCopy.title}
        body={errorCopy.body}
        onRetry={() => void ticketsQuery.refetch()}
        className="my-auto"
      />
    )
  } else {
    content = <State kind="loading" />
  }

  return (
    <section className="flex flex-1 flex-col gap-5 pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] leading-[1.4] font-bold text-ink">{copy.title}</h1>
        <p className="text-[13px] leading-[1.6] text-ink-muted">{copy.description}</p>
      </div>
      {draft && isCreating && (
        <p role="status" className="text-[13px] leading-[1.6] text-ink-muted">
          {copy.creating}
        </p>
      )}
      {draft && createFailed && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] bg-danger/10 px-3 py-2.5 text-[13px] leading-[1.6] text-danger"
        >
          <p className="min-w-0 flex-1">{copy.createError}</p>
          <button
            type="button"
            onClick={() => void saveDraft(draft, tickets ?? [])}
            className="-my-1 shrink-0 py-1 font-bold whitespace-nowrap underline"
          >
            {ja.common.retry}
          </button>
        </div>
      )}
      {deleteFailed && (
        <p
          role="alert"
          className="rounded-[10px] bg-danger/10 px-3 py-2.5 text-[13px] leading-[1.6] text-danger"
        >
          {copy.deleteError}
        </p>
      )}
      {content}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  )
}
