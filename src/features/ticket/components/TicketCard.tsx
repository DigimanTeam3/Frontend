import { ja } from '@/shared/i18n/ja'
import { formatDate } from '@/shared/lib/formatDate'
import type { Ticket } from '@/shared/types/ticket'

export interface TicketCardProps {
  ticket: Ticket
  onDelete: (ticketId: number) => void
}

// One saved condition as a ticket (Figma: S17 ReservationTicket). A ticket that has matched an
// event gets the solid pink frame and the pill; the others have the dashed frame.
export function TicketCard({ ticket, onDelete }: TicketCardProps) {
  const { reservationTicket: copy } = ja

  return (
    <li
      className={`flex flex-col gap-2.5 rounded-[14px] bg-surface px-4 py-3.5 ${
        ticket.matched ? 'border-gate border-2' : 'border-[1.5px] border-dashed border-ink-faint'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-[15px] leading-[1.65] font-bold text-ink">{copy.cardLabel}</p>
        {ticket.matched && (
          <span className="bg-gate ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs leading-normal font-bold text-white">
            {copy.arrived}
          </span>
        )}
      </div>

      <p className="font-mincho text-[15px] leading-[1.5] font-extrabold break-words text-ink">
        {ticket.condition}
      </p>

      {ticket.labels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {ticket.labels.map((label, index) => (
            <li
              // With the index: two labels may have the same text.
              key={`${index}-${label}`}
              className="text-festival border-festival rounded-md border-[1.5px] px-2.5 py-1 text-[13px] leading-normal font-bold break-words"
            >
              {label}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-dashed border-ink-faint pt-2.5">
        <p className="min-w-0 flex-1 text-xs leading-normal text-ink-muted">
          {copy.savedOn(formatDate(ticket.createdAt))}
        </p>
        <button
          type="button"
          aria-label={copy.deleteLabel(ticket.condition)}
          onClick={() => onDelete(ticket.id)}
          className="-my-2 -mr-2 shrink-0 px-2 py-2.5 text-[13px] leading-normal font-bold text-danger"
        >
          {copy.delete}
        </button>
      </div>
    </li>
  )
}
