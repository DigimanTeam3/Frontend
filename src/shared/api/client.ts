import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/shared/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Single place for API calls: base URL, JWT header, JSON parsing, errors. */
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    // Our token was rejected: the login is over. RequireAuth then sends protected screens to /login.
    // Skip if the user has logged in again with a new token in the meantime.
    if (response.status === 401 && token && useAuthStore.getState().accessToken === token) {
      useAuthStore.getState().logout({ expired: true })
      // Same as LogoutButton: drop server data cached for the old login.
      queryClient.clear()
    }
    throw new ApiError(response.status, await response.text())
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
