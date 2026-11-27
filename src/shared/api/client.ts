import { useAuthStore } from '@/shared/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  /** Seconds from the Retry-After header (e.g. 429), or null. */
  readonly retryAfter: number | null

  constructor(status: number, message: string, retryAfter: number | null = null) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

function parseRetryAfter(value: string | null) {
  const seconds = Number(value)
  return value && Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

/** Single place for API calls: base URL, JWT header, JSON parsing, errors. */
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  // FormData (file upload) sets its own multipart Content-Type with the boundary.
  const isFormData = init.body instanceof FormData
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await response.text(),
      parseRetryAfter(response.headers.get('Retry-After')),
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
