import { NavLink } from 'react-router'
import { ja } from '@/shared/i18n/ja'

const TABS = [
  { to: '/', end: true, ...ja.nav.home },
  { to: '/map', end: false, ...ja.nav.map },
  { to: '/me', end: false, ...ja.nav.wallet },
] as const

// Bottom tab bar (Figma: Concept 切符 / nav). Sits above the iPhone home indicator.
export function TabBar() {
  return (
    <nav
      aria-label={ja.nav.label}
      className="sticky bottom-0 z-10 border-t border-line bg-surface pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <ul className="flex px-3">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex min-h-[52px] flex-col items-center justify-center gap-0.5 leading-[1.4] transition-colors duration-150 ease-out ${
                  isActive ? 'text-ink' : 'text-ink-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[9px] font-semibold tracking-[0.14em] ${isActive ? '' : 'text-ink-faint'}`}
                  >
                    {tab.code}
                  </span>
                  <span className={`text-xs ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {tab.name}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
