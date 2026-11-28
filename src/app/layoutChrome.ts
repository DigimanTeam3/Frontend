import { generatePath, matchPath } from 'react-router'

// Which bars RootLayout shows around each screen.
// - tabs: bottom tab bar, no top bar (top-level screens draw their own big title)
// - back: top bar with a back (or close) button, no tab bar (screens reached from a top-level screen)
// - bare: nothing (full-screen scenes; the page draws its own TopBar, e.g. with a venue title)
export type LayoutChrome =
  | { kind: 'tabs' }
  | { kind: 'bare' }
  | { kind: 'back'; leading: 'back' | 'close'; fallback: string }

const TAB_PATHS = ['/', '/map', '/me']

// Add a path here when its page lays itself out edge to edge and renders its own TopBar.
const BARE_PATHS: string[] = [
  '/concierge', // S16: counter pinned at the top, input bar at the bottom
]

// The gate flow is a scene you leave rather than go back from, so it gets a close button.
const CLOSE_PATHS = [
  '/events/:eventId/check-in', // S09
  '/events/:eventId/badge', // S10
]

// Parent screen for the back button when there is no earlier screen in this app
// (opened from a LINE link or after a reload). First match wins; anything else goes home.
const BACK_PARENTS: [pattern: string, parent: string][] = [
  ['/events/:eventId', '/'],
  ['/events/:eventId/missions/:missionId', '/events/:eventId/missions'],
  ['/events/:eventId/companions/new', '/events/:eventId/companions'],
  ['/events/:eventId/*', '/events/:eventId'],
  ['/me/*', '/me'],
  ['/cards/:cardId', '/me'],
]

const matchesAny = (paths: string[], pathname: string) =>
  paths.some((path) => matchPath(path, pathname))

export function getLayoutChrome(pathname: string, isNotFound: boolean): LayoutChrome {
  // The 404 screen keeps the tab bar so the user can always get back to a main screen.
  if (isNotFound || matchesAny(TAB_PATHS, pathname)) return { kind: 'tabs' }
  if (matchesAny(BARE_PATHS, pathname)) return { kind: 'bare' }

  const leading = matchesAny(CLOSE_PATHS, pathname) ? 'close' : 'back'
  for (const [pattern, parent] of BACK_PARENTS) {
    const match = matchPath(pattern, pathname)
    if (match) return { kind: 'back', leading, fallback: generatePath(parent, match.params) }
  }
  return { kind: 'back', leading, fallback: '/' }
}
