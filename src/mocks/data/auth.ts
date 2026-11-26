import type { AuthUser } from '@/shared/types/auth'

/** The code the mock LINE step hands back (see src/features/auth/lineLogin.ts). */
export const MOCK_AUTH_CODE = 'mock-auth-code'
/** Any API called with this token answers 401, to try the expired-login flow. */
export const MOCK_EXPIRED_TOKEN = 'mock-expired-token'

export const MOCK_ACCESS_TOKEN = 'mock-access-token'
export const MOCK_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

export const mockUser: AuthUser = {
  id: 1,
  displayName: 'さくら',
  pictureUrl: null,
}
