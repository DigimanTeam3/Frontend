import { NavLink } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import { TabMapIcon, TabTicketIcon, TabUserIcon } from '@/shared/ui/icons/TabIcons'

const TABS = [
  { to: '/', end: true, Icon: TabTicketIcon, ...ja.nav.home },
  { to: '/map', end: false, Icon: TabMapIcon, ...ja.nav.map },
  { to: '/me', end: false, Icon: TabUserIcon, ...ja.nav.wallet },
] as const

// Bottom tab bar (Figma: ui / BottomNav). Sits above the iPhone home indicator.
export function TabBar() {
  return (
    <nav
      aria-label={ja.nav.label}
      className="sticky bottom-0 z-10 border-t border-line bg-surface pt-2 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <ul className="flex justify-between px-6">
        {TABS.map(({ to, end, Icon, name }) => (
          <li key={to} className="w-24">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-1.5 text-xs/[1.5] font-bold transition-colors duration-150 ease-out ${
                  isActive ? 'text-ink' : 'text-ink-faint'
                }`
              }
            >
              <Icon className="size-6" />
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
