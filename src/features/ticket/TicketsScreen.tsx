// TODO(api): provisional — no backend API for saved conditions (予約券) yet. Paths and fields are placeholders for the mock only.
import { useState } from 'react'
import { useDeleteTicketMutation, useTicketsQuery } from '@/features/ticket/api'
import { TicketCard } from '@/features/ticket/components/TicketCard'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/lib/apiError'
import { State } from '@/shared/ui/State'
import { Toast } from '@/shared/ui/Toast'

// S17 saved conditions (/me/tickets, Figma: S17 切符入れ（予約券）): the search conditions saved
// from the AI concierge, with delete. The swipe gesture of the design is a plain button for now.
export function TicketsScreen() {
  const { ticket: copy } = ja
  const ticketsQuery = useTicketsQuery()
  const deleteMutation = useDeleteTicketMutation()
  const [toast, setToast] = useState<string | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const tickets = ticketsQuery.data?.items

  function deleteTicket(ticketId: number) {
    setDeleteFailed(false)
    deleteMutation.mutate(ticketId, {
      onSuccess: () => setToast(copy.deleted),
      onError: () => setDeleteFailed(true),
    })
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
            <TicketCard key={ticket.id} ticket={ticket} onDelete={deleteTicket} />
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
