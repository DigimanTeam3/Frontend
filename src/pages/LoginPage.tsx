import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useGuestLoginMutation, useLineLoginMutation } from '@/features/auth/api'
import { LoginHero } from '@/features/auth/components/LoginHero'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import {
  clearPendingLogin,
  getRedirectUri,
  readLineCallback,
  startLineLogin,
} from '@/features/auth/lineLogin'
import { isApiError } from '@/shared/api/errors'
import { ja } from '@/shared/i18n/ja'
import { isNetworkError } from '@/shared/lib/apiError'
import { safeRedirect } from '@/shared/lib/safeRedirect'
import { useAuthStore } from '@/shared/stores/authStore'

type Notice = 'cancelled' | 'failed' | 'lineUnavailable' | 'guestFailed' | 'network' | 'loggedOut'

const noticeText: Record<Notice | 'expired', string> = {
  cancelled: ja.login.cancelled,
  failed: ja.login.failed,
  lineUnavailable: ja.login.lineUnavailable,
  guestFailed: ja.login.guestFailed,
  network: ja.login.network,
  loggedOut: ja.login.loggedOut,
  expired: ja.login.expired,
}

const errorNotices: ReadonlySet<Notice | 'expired'> = new Set([
  'failed',
  'lineUnavailable',
  'guestFailed',
  'network',
  'expired',
])

function lineErrorNotice(error: unknown): Notice {
  if (isNetworkError(error)) return 'network'
  // 503: LINE login is not set up on the server yet.
  return isApiError(error, 503) ? 'lineUnavailable' : 'failed'
}

// S01. /login?redirect=<path> starts LINE login; LINE comes back to /login?code=…&state=….
export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const login = useAuthStore((state) => state.login)
  const clearSessionExpired = useAuthStore((state) => state.clearSessionExpired)
  // Keep the "login ran out" notice for this visit only; the store flag is reset below.
  const [expiredOnOpen] = useState(() => useAuthStore.getState().sessionExpired)
  const { mutateAsync: loginWithLine, isPending } = useLineLoginMutation()
  const { mutateAsync: loginAsGuest, isPending: isGuestPending } = useGuestLoginMutation()
  const handledRef = useRef(false)
  // Read the LINE callback (if any) once, on the first render.
  const [callback] = useState(() => readLineCallback(searchParams))
  const [callbackState] = useState(() => searchParams.get('state'))
  const [notice, setNotice] = useState<Notice | null>(() =>
    callback.type === 'cancelled' || callback.type === 'failed' ? callback.type : null,
  )
  const [starting, setStarting] = useState(false)

  const hasCallback = searchParams.has('code') || searchParams.has('error')
  const redirectParam = searchParams.get('redirect')
  const redirectTo = safeRedirect(redirectParam)

  // The notice was read above, so the flag does not linger into later visits.
  useEffect(() => {
    if (expiredOnOpen) clearSessionExpired()
  }, [expiredOnOpen, clearSessionExpired])

  // Finish the LINE callback once (the ref also guards the StrictMode double run).
  useEffect(() => {
    if (handledRef.current || callback.type === 'none') return
    handledRef.current = true
    clearPendingLogin(callbackState)
    // Take code/state out of the address bar and keep where to go next.
    setSearchParams({ redirect: callback.redirect }, { replace: true })
    if (callback.type !== 'code') return
    loginWithLine({
      code: callback.code,
      redirectUri: getRedirectUri(),
      codeVerifier: callback.codeVerifier,
      nonce: callback.nonce,
    }).then(login, (error: unknown) => setNotice(lineErrorNotice(error)))
  }, [callback, callbackState, setSearchParams, loginWithLine, login])

  const handleLineLogin = () => {
    setStarting(true)
    setNotice(null)
    clearSessionExpired()
    // Fails only when LINE login cannot start here (no channel ID configured).
    startLineLogin(redirectTo).catch(() => {
      setStarting(false)
      setNotice('lineUnavailable')
    })
  }

  const handleGuestLogin = () => {
    setNotice(null)
    clearSessionExpired()
    loginAsGuest().then(
      (session) => {
        // Keep the destination in the URL so the logged-in render below navigates there.
        setSearchParams({ redirect: redirectTo }, { replace: true })
        login(session)
      },
      (error: unknown) => setNotice(isNetworkError(error) ? 'network' : 'guestFailed'),
    )
  }

  if (hasCallback || isPending || isGuestPending) {
    return (
      <section role="status" className="flex flex-col items-center gap-4 py-24">
        <span className="size-8 animate-spin rounded-full border-4 border-line border-t-line-brand" />
        <p className="text-ink-muted">{ja.login.processing}</p>
      </section>
    )
  }

  if (accessToken) {
    // Logged in and sent here with a destination (also right after login): go there.
    if (redirectParam !== null) return <Navigate to={redirectTo} replace />
    return (
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-line-brand text-2xl font-bold text-white">
          {user?.displayName.slice(0, 1)}
        </span>
        <p className="font-bold">{ja.login.loggedInAs(user?.displayName ?? '')}</p>
        <div className="flex w-full flex-col gap-3">
          <Link to="/" className="rounded-xl bg-ink py-4 font-bold text-surface">
            {ja.login.goHome}
          </Link>
          <LogoutButton
            onLoggedOut={() => setNotice('loggedOut')}
            className="rounded-xl border border-line py-4 font-bold text-ink"
          />
        </div>
      </section>
    )
  }

  const message = notice ?? (sessionExpired || (expiredOnOpen && !starting) ? 'expired' : null)
  const isError = message !== null && errorNotices.has(message)

  return (
    <section className="flex flex-col">
      <LoginHero />
      <h1 className="mt-4 font-serif text-2xl leading-snug font-bold whitespace-pre-line">
        {ja.login.headline}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{ja.login.lead}</p>

      {message && (
        <p
          role="alert"
          className={`mt-6 rounded-lg px-4 py-3 text-sm ${isError ? 'bg-danger/10 text-danger' : 'bg-line/60 text-ink'}`}
        >
          {noticeText[message]}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={handleLineLogin}
          disabled={starting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-line-brand py-4 font-bold text-white disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 3C6.48 3 2 6.58 2 11c0 3.95 3.55 7.27 8.34 7.9.32.07.77.21.88.49.1.25.07.65.03.9l-.14.86c-.04.25-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.8C21.33 14.3 22 12.73 22 11c0-4.42-4.48-8-10-8Z"
            />
          </svg>
          {ja.login.lineButton}
        </button>
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={starting}
          className="w-full rounded-xl border border-line bg-surface py-4 font-bold text-ink disabled:opacity-60"
        >
          {ja.login.guestButton}
        </button>
        <Link to="/" className="text-sm font-bold text-ink-muted">
          {ja.login.browse}
        </Link>
        <p className="text-center text-xs leading-relaxed text-ink-muted">{ja.login.terms}</p>
      </div>
    </section>
  )
}
