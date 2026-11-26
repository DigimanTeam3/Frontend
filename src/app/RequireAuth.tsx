import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/shared/stores/authStore'

// Wraps routes that need login. Logged-out users go to /login and come back here afterwards.
export function RequireAuth() {
  const isLoggedIn = useAuthStore((state) => state.accessToken !== null)
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <Outlet />
}
