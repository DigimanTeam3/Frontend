// S01 login. Shapes follow POST /api/auth/line and POST /api/auth/demo-login (both return LoginResponse).
export interface AuthUser {
  id: number
  displayName: string
  pictureUrl: string | null
}

export interface LineLoginRequest {
  code: string
  redirectUri: string
  codeVerifier: string
  nonce: string
}

/** Guest login. The whole body is optional. */
export interface DemoLoginRequest {
  displayName?: string
  language?: 'ja' | 'ko'
}

export interface LoginResponse {
  accessToken: string
  /** ISO 8601. The saved login is dropped after this time. */
  expiresAt: string
  user: AuthUser
}
