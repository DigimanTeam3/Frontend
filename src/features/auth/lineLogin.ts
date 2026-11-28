import { safeRedirect } from '@/shared/lib/safeRedirect'

// LINE Login v2.1 (authorization code + PKCE). The channel secret stays on the backend;
// the browser only knows the public channel ID.
const AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
// Kept in localStorage, not sessionStorage: on a phone, LINE login through the LINE app comes back
// in a new browser tab, which does not see the first tab's sessionStorage. Keyed by state so two
// tabs logging in at once do not overwrite each other, and dropped after PENDING_TTL_MS.
const PENDING_KEY = 'digiman.lineLogin'
const PENDING_TTL_MS = 10 * 60 * 1000
const isMock = import.meta.env.VITE_USE_MOCK === 'true'
// Same value as MOCK_AUTH_CODE in src/mocks/data/auth.ts.
const MOCK_AUTH_CODE = 'mock-auth-code'

interface PendingLogin {
  state: string
  nonce: string
  codeVerifier: string
  redirect: string
}

type StoredLogins = Record<string, PendingLogin & { createdAt: number }>

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

/** Saved login attempts that have not run out. Unreadable or broken storage counts as none. */
function readStored(): StoredLogins {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    if (!value || typeof value !== 'object') return Object.create(null) as StoredLogins
    const now = Date.now()
    // No prototype: keys come from the URL's state (e.g. "__proto__" must stay a plain key).
    const stored = Object.create(null) as StoredLogins
    for (const [state, entry] of Object.entries(value as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue
      const e = entry as Partial<PendingLogin & { createdAt: number }>
      if (
        typeof e.nonce !== 'string' ||
        typeof e.codeVerifier !== 'string' ||
        typeof e.createdAt !== 'number' ||
        now - e.createdAt > PENDING_TTL_MS
      ) {
        continue
      }
      stored[state] = {
        state,
        nonce: e.nonce,
        codeVerifier: e.codeVerifier,
        redirect: safeRedirect(typeof e.redirect === 'string' ? e.redirect : null),
        createdAt: e.createdAt,
      }
    }
    return stored
  } catch {
    return Object.create(null) as StoredLogins
  }
}

function writeStored(stored: StoredLogins) {
  if (Object.keys(stored).length === 0) localStorage.removeItem(PENDING_KEY)
  else localStorage.setItem(PENDING_KEY, JSON.stringify(stored))
}

function savePending(pending: PendingLogin) {
  const stored = readStored()
  stored[pending.state] = { ...pending, createdAt: Date.now() }
  writeStored(stored)
}

/** Call once the callback has been read, so the same attempt cannot be used twice. */
export function clearPendingLogin(state: string | null) {
  try {
    const stored = readStored()
    if (state && Object.hasOwn(stored, state)) delete stored[state]
    // Written back even when nothing matched, which also drops the attempts that ran out.
    writeStored(stored)
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
    savePending(pending)
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
  savePending(pending)
  window.location.replace(`${AUTHORIZE_URL}?${params}`)
}

/**
 * Reads the LINE callback on /login (?code=…&state=… or ?error=…&state=…).
 * The state must match a saved login attempt. Does not clear it (see clearPendingLogin).
 */
export function readLineCallback(searchParams: URLSearchParams): LineCallbackResult {
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  if (!code && !error) return { type: 'none' }

  const state = searchParams.get('state')
  const stored = readStored()
  const pending = state && Object.hasOwn(stored, state) ? stored[state] : null
  if (!pending) return { type: 'failed', redirect: '/' }
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
