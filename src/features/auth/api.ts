import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { LineLoginRequest, LoginResponse } from '@/shared/types/auth'

export function loginWithLine(request: LineLoginRequest) {
  return apiClient<LoginResponse>('/auth/line', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function useLineLoginMutation() {
  return useMutation({ mutationFn: loginWithLine })
}
