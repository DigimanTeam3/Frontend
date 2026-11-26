import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/app/RootLayout'
import { EventListPage } from '@/pages/EventListPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ja } from '@/shared/i18n/ja'

// All routes live here. Tell the other person when you change this file.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Shown while a lazy route (e.g. /map) loads on a direct visit.
    hydrateFallbackElement: <p className="p-4 text-ink-muted">{ja.common.loading}</p>,
    children: [
      { index: true, element: <EventListPage /> },
      // The map bundle (MapLibre) is large, so load it only when the map tab opens.
      {
        path: 'map',
        lazy: () => import('@/pages/MapPage').then((m) => ({ Component: m.MapPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
