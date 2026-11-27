import { Outlet, ScrollRestoration, useLocation, useParams } from 'react-router'
import { getLayoutChrome } from '@/app/layoutChrome'
import { TabBar } from '@/shared/ui/TabBar'
import { TopBar } from '@/shared/ui/TopBar'

const MAIN_PADDING = {
  // No top bar: keep clear of the status bar / notch. The tab bar handles the bottom.
  tabs: 'px-gutter pt-[calc(env(safe-area-inset-top)+16px)] pb-6',
  // The top bar handles the top. No tab bar, so keep clear of the home indicator here.
  back: 'px-gutter pt-2 pb-[calc(env(safe-area-inset-bottom)+24px)]',
  // Full-screen scenes lay out edge to edge and handle safe areas themselves.
  bare: '',
} as const

// Mobile frame for every screen: 390px design, up to 430px wide, centered on larger screens.
// Bars per screen are decided in layoutChrome.ts. Safe areas need viewport-fit=cover (index.html).
export function RootLayout() {
  const { pathname } = useLocation()
  // Only the catch-all (404) route has a "*" param.
  const isNotFound = useParams()['*'] !== undefined
  const chrome = getLayoutChrome(pathname, isNotFound)
  const padding = chrome.kind === 'tabs' && chrome.fullBleed ? '' : MAIN_PADDING[chrome.kind]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-app text-ink">
      {chrome.kind === 'back' && <TopBar leading={chrome.leading} fallback={chrome.fallback} />}
      <main className={`flex flex-1 flex-col ${padding}`}>
        <Outlet />
      </main>
      {chrome.kind === 'tabs' && <TabBar />}
      <ScrollRestoration />
    </div>
  )
}
