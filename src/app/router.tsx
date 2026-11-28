import { createBrowserRouter } from 'react-router'
import { RequireAuth } from '@/app/RequireAuth'
import { RootLayout } from '@/app/RootLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ja } from '@/shared/i18n/ja'

// All 18 screens (S01–S18) are registered here. Each screen lives in its own file under
// src/pages and is loaded only when opened. Tell the other person when you change this file.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Shown while a lazy route loads on a direct visit.
    hydrateFallbackElement: <p className="p-4 text-ink-muted">{ja.common.loading}</p>,
    children: [
      // No login needed
      {
        index: true, // S02
        lazy: () => import('@/pages/HomePage').then((m) => ({ Component: m.HomePage })),
      },
      {
        path: 'login', // S01
        lazy: () => import('@/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: 'search', // S03
        lazy: () => import('@/pages/SearchPage').then((m) => ({ Component: m.SearchPage })),
      },
      {
        path: 'map', // S04 (MapLibre is large, so this split matters most)
        lazy: () => import('@/pages/MapPage').then((m) => ({ Component: m.MapPage })),
      },
      {
        path: 'events/:eventId', // S05
        lazy: () =>
          import('@/pages/EventDetailPage').then((m) => ({ Component: m.EventDetailPage })),
      },
      {
        path: 'events/:eventId/companions', // S06
        lazy: () =>
          import('@/pages/CompanionListPage').then((m) => ({ Component: m.CompanionListPage })),
      },
      {
        path: 'concierge', // S16
        lazy: () => import('@/pages/ConciergePage').then((m) => ({ Component: m.ConciergePage })),
      },

      // Login needed
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'events/:eventId/companions/new', // S07
            lazy: () =>
              import('@/pages/CompanionNewPage').then((m) => ({ Component: m.CompanionNewPage })),
          },
          {
            path: 'companions/:postId', // S08
            lazy: () =>
              import('@/pages/CompanionDetailPage').then((m) => ({
                Component: m.CompanionDetailPage,
              })),
          },
          {
            path: 'companions/:postId/chat', // S08 chat after a match
            lazy: () =>
              import('@/pages/CompanionChatPage').then((m) => ({
                Component: m.CompanionChatPage,
              })),
          },
          {
            path: 'events/:eventId/check-in', // S09
            lazy: () => import('@/pages/CheckInPage').then((m) => ({ Component: m.CheckInPage })),
          },
          {
            path: 'events/:eventId/badge', // S10
            lazy: () =>
              import('@/pages/ParticipationBadgePage').then((m) => ({
                Component: m.ParticipationBadgePage,
              })),
          },
          {
            path: 'events/:eventId/missions', // S11
            lazy: () =>
              import('@/pages/MissionListPage').then((m) => ({ Component: m.MissionListPage })),
          },
          {
            path: 'events/:eventId/missions/:missionId', // S12
            lazy: () =>
              import('@/pages/MissionSubmitPage').then((m) => ({ Component: m.MissionSubmitPage })),
          },
          {
            path: 'events/:eventId/complete', // S13
            lazy: () => import('@/pages/CompletePage').then((m) => ({ Component: m.CompletePage })),
          },
          {
            path: 'cards/:cardId', // S14
            lazy: () =>
              import('@/pages/CardDetailPage').then((m) => ({ Component: m.CardDetailPage })),
          },
          {
            path: 'me', // S15
            lazy: () => import('@/pages/MyPage').then((m) => ({ Component: m.MyPage })),
          },
          {
            path: 'me/tickets', // S17
            lazy: () => import('@/pages/TicketsPage').then((m) => ({ Component: m.TicketsPage })),
          },
          {
            path: 'notifications/:notificationId', // S18 (link in the LINE message)
            lazy: () =>
              import('@/pages/NotificationEventPage').then((m) => ({
                Component: m.NotificationEventPage,
              })),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
