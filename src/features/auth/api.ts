import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { DemoLoginRequest, LineLoginRequest, LoginResponse } from '@/shared/types/auth'

export function loginWithLine(request: LineLoginRequest) {
  return apiClient<LoginResponse>('/auth/line', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function useLineLoginMutation() {
  return useMutation({ mutationFn: loginWithLine })
}

/** Guest (demo) login: no LINE account needed. Answers 201 with the same shape as LINE login. */
export function loginAsGuest(request: DemoLoginRequest = { language: 'ja' }) {
  return apiClient<LoginResponse>('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function useGuestLoginMutation() {
  return useMutation({ mutationFn: () => loginAsGuest() })
}
