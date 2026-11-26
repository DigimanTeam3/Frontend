// S01 login. Shapes follow the API spec proposal for POST /api/auth/line.
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

export interface LoginResponse {
  accessToken: string
  /** ISO 8601. The saved login is dropped after this time. */
  expiresAt: string
  user: AuthUser
}
