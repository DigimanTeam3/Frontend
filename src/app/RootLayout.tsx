import { NavLink, Outlet } from 'react-router'
import { ja } from '@/shared/i18n/ja'

const navItems = [
  { to: '/', label: ja.nav.events },
  { to: '/map', label: ja.nav.map },
]

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-surface text-ink">
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
      {/* Keep the tab bar above the iPhone home indicator (needs viewport-fit=cover). */}
      <nav className="sticky bottom-0 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${isActive ? 'font-bold text-primary' : 'text-ink-muted'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
