import { QueryClient } from '@tanstack/react-query'
import { shouldRetryQuery } from '@/shared/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetryQuery, staleTime: 30_000 },
  },
})
