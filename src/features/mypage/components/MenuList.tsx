import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CompanionRecordList } from '@/features/mypage/components/CompanionRecordList'
import { ParticipationList } from '@/features/mypage/components/ParticipationList'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { useAuthStore } from '@/shared/stores/authStore'
import type { MySummary } from '@/shared/types/me'
import { ChevronRightIcon } from '@/shared/ui/icons/ChevronRightIcon'
import { GlobeIcon } from '@/shared/ui/icons/GlobeIcon'
import { LogoutIcon } from '@/shared/ui/icons/LogoutIcon'
import { PenIcon } from '@/shared/ui/icons/PenIcon'
import { PeopleIcon } from '@/shared/ui/icons/PeopleIcon'
import { TicketIcon } from '@/shared/ui/icons/TicketIcon'

export interface MenuListProps {
  summary: MySummary
}

const ROW_CLASS =
  'flex min-h-[54px] w-full items-center gap-3 border-b border-line px-1 py-3.5 text-left'

interface RowBodyProps {
  icon: ReactNode
  label: string
  value?: number
  chevron?: ReactNode
}

// Icon, label, value and chevron of a menu row (Figma: S15 ListRow).
function RowBody({ icon, label, value, chevron }: RowBodyProps) {
  return (
    <>
      <span className="shrink-0 text-ink-muted">{icon}</span>
      <span className="min-w-0 flex-1 text-[15px] leading-[1.65] break-words text-ink">
        {label}
      </span>
      {value !== undefined && (
        <span className="text-ink-faint shrink-0 text-[13px] leading-[1.6] whitespace-nowrap">
          {value}
        </span>
      )}
      {chevron}
    </>
  )
}

const CHEVRON = 'size-[18px] shrink-0 text-ink-faint'

export function MenuList({ summary }: MenuListProps) {
  const { menu: copy } = ja.myPage
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [participationsOpen, setParticipationsOpen] = useState(false)
  const panelId = useId()
  const [companionsOpen, setCompanionsOpen] = useState(false)
  const companionsPanelId = useId()

  const loggingOut = useRef(false)

  // Leave first, then log out: with the token gone while /me is still open, the login guard
  // would send the user to /login?redirect=/me instead of home. So the token is cleared when
  // this screen has really closed. Waiting for navigate() is not enough: it resolves while the
  // home page (a lazy route) may still be a pending render.
  useEffect(
    () => () => {
      if (!loggingOut.current) return
      useAuthStore.getState().setAccessToken(null)
      // Nothing of this user may stay in the cache for the next login.
      queryClient.clear()
    },
    [queryClient],
  )

  const logout = () => {
    if (loggingOut.current) return
    loggingOut.current = true
    void navigate(paths.home(), { replace: true })
  }

  return (
    <ul>
      <li>
        <button
          type="button"
          aria-expanded={participationsOpen}
          aria-controls={panelId}
          onClick={() => setParticipationsOpen(!participationsOpen)}
          className={ROW_CLASS}
        >
          <RowBody
            icon={<PeopleIcon />}
            label={copy.participations}
            value={summary.participatedEventCount}
            chevron={
              <ChevronRightIcon
                className={`${CHEVRON} motion-safe:transition-transform ${
                  participationsOpen ? 'rotate-90' : ''
                }`}
              />
            }
          />
        </button>
        <div id={panelId}>{participationsOpen && <ParticipationList />}</div>
      </li>
      <li>
        <button
          type="button"
          aria-expanded={companionsOpen}
          aria-controls={companionsPanelId}
          onClick={() => setCompanionsOpen(!companionsOpen)}
          className={ROW_CLASS}
        >
          <RowBody
            icon={<PenIcon />}
            label={copy.recruitments}
            value={summary.recruitmentCount}
            chevron={
              <ChevronRightIcon
                className={`${CHEVRON} motion-safe:transition-transform ${
                  companionsOpen ? 'rotate-90' : ''
                }`}
              />
            }
          />
        </button>
        <div id={companionsPanelId}>{companionsOpen && <CompanionRecordList />}</div>
      </li>
      <li>
        <Link to={paths.tickets()} className={ROW_CLASS}>
          <RowBody
            icon={<TicketIcon />}
            label={copy.tickets}
            chevron={<ChevronRightIcon className={CHEVRON} />}
          />
        </Link>
      </li>
      <li className={ROW_CLASS}>
        <RowBody icon={<GlobeIcon />} label={copy.language} />
      </li>
      <li>
        <button type="button" onClick={logout} className={ROW_CLASS}>
          <RowBody icon={<LogoutIcon />} label={copy.logout} />
        </button>
      </li>
    </ul>
  )
}
