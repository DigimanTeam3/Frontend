import { safeRedirect } from '@/shared/lib/safeRedirect'

// LINE Login v2.1 (authorization code + PKCE). The channel secret stays on the backend;
// the browser only knows the public channel ID.
const AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const PENDING_KEY = 'digiman.lineLogin'
const isMock = import.meta.env.VITE_USE_MOCK === 'true'
// Same value as MOCK_AUTH_CODE in src/mocks/data/auth.ts.
const MOCK_AUTH_CODE = 'mock-auth-code'

interface PendingLogin {
  state: string
  nonce: string
  codeVerifier: string
  redirect: string
}

export type LineCallbackResult =
  | { type: 'none' }
  | { type: 'cancelled'; redirect: string }
  | { type: 'failed'; redirect: string }
  | { type: 'code'; redirect: string; code: string; codeVerifier: string; nonce: string }

/** LINE sends the user back here. Register this exact URL as the channel's callback URL. */
export function getRedirectUri() {
  return `${window.location.origin}/login`
}

function base64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)))
}

async function codeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  return base64Url(new Uint8Array(digest))
}

function readPending(): PendingLogin | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PendingLogin>
    if (
      typeof value.state !== 'string' ||
      typeof value.nonce !== 'string' ||
      typeof value.codeVerifier !== 'string'
    ) {
      return null
    }
    return {
      state: value.state,
      nonce: value.nonce,
      codeVerifier: value.codeVerifier,
      redirect: safeRedirect(typeof value.redirect === 'string' ? value.redirect : null),
    }
  } catch {
    return null
  }
}

/** Call once the callback has been read, so the same attempt cannot be used twice. */
export function clearPendingLogin() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Storage blocked: nothing to clear.
  }
}

/**
 * Leaves the app for the LINE consent screen. `redirect` is where to go after login.
 * In mock mode the LINE step is skipped and the app comes straight back with a mock code.
 */
export async function startLineLogin(redirect: string) {
  const pending: PendingLogin = {
    state: randomString(),
    nonce: randomString(),
    codeVerifier: randomString(),
    redirect: safeRedirect(redirect),
  }

  if (isMock) {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    const params = new URLSearchParams({ code: MOCK_AUTH_CODE, state: pending.state })
    window.location.replace(`/login?${params}`)
    return
  }

  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID
  if (!channelId) throw new Error('VITE_LINE_CHANNEL_ID is not set')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: getRedirectUri(),
    state: pending.state,
    scope: 'profile openid',
    nonce: pending.nonce,
    code_challenge: await codeChallenge(pending.codeVerifier),
    code_challenge_method: 'S256',
    // Asks the user to add the official account as a friend (needed for LINE notifications, S18).
    bot_prompt: 'aggressive',
  })
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  window.location.replace(`${AUTHORIZE_URL}?${params}`)
}

/**
 * Reads the LINE callback on /login (?code=…&state=… or ?error=…&state=…).
 * The state must match the saved login attempt. Does not clear it (see clearPendingLogin).
 */
export function readLineCallback(searchParams: URLSearchParams): LineCallbackResult {
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  if (!code && !error) return { type: 'none' }

  const pending = readPending()
  const state = searchParams.get('state')
  if (!pending || !state || state !== pending.state) {
    return { type: 'failed', redirect: pending?.redirect ?? '/' }
  }
  if (error) {
    // access_denied: the user pressed cancel on the LINE screen.
    return { type: error === 'access_denied' ? 'cancelled' : 'failed', redirect: pending.redirect }
  }
  return {
    type: 'code',
    redirect: pending.redirect,
    code: code ?? '',
    codeVerifier: pending.codeVerifier,
    nonce: pending.nonce,
  }
}
