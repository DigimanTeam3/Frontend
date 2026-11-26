import { useAuthStore } from '@/shared/stores/authStore'
import { ApiError } from '@/shared/api/errors'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// ApiError lives in errors.ts with its helpers. Re-exported so `from '@/shared/api/client'` keeps working.
export { ApiError }

/** Single place for API calls: base URL, JWT header, JSON parsing, errors. */
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
