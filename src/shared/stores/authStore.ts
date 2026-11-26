import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthUser, LoginResponse } from '@/shared/types/auth'

interface AuthState {
  accessToken: string | null
  expiresAt: string | null
  user: AuthUser | null
  /** True after the login ran out (401 or expired on load), so the login screen can say so. */
  sessionExpired: boolean
  login: (session: LoginResponse) => void
  logout: (options?: { expired?: boolean }) => void
}

type SavedAuth = Pick<AuthState, 'accessToken' | 'expiresAt' | 'user'>

function isExpired(expiresAt: string | null | undefined) {
  const time = expiresAt ? Date.parse(expiresAt) : Number.NaN
  return Number.isNaN(time) || time <= Date.now()
}

function toUser(value: unknown): AuthUser | null {
  const user = value as Partial<AuthUser> | null | undefined
  if (typeof user?.id !== 'number' || typeof user.displayName !== 'string') return null
  return {
    id: user.id,
    displayName: user.displayName,
    pictureUrl: typeof user.pictureUrl === 'string' ? user.pictureUrl : null,
  }
}

// Only login state lives here. Server data belongs to TanStack Query.
// The login is kept in localStorage ("digiman.auth") so a reload does not log the user out.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: null,
      user: null,
      sessionExpired: false,
      login: ({ accessToken, expiresAt, user }) =>
        set({ accessToken, expiresAt, user, sessionExpired: false }),
      logout: ({ expired = false } = {}) =>
        set({ accessToken: null, expiresAt: null, user: null, sessionExpired: expired }),
    }),
    {
      name: 'digiman.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ accessToken, expiresAt, user }): SavedAuth => ({
        accessToken,
        expiresAt,
        user,
      }),
      // Restore a saved login only while it is still valid.
      merge: (persisted, current) => {
        const saved = persisted as Partial<SavedAuth> | undefined
        if (typeof saved?.accessToken !== 'string') return current
        if (isExpired(saved.expiresAt)) return { ...current, sessionExpired: true }
        return {
          ...current,
          accessToken: saved.accessToken,
          expiresAt: saved.expiresAt ?? null,
          user: toUser(saved.user),
        }
      },
    },
  ),
)
