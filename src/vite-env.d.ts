/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_LINE_CHANNEL_ID?: string
  /** "off": read replies with the browser voice only (no POST /concierge/speech). */
  readonly VITE_SERVER_VOICE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
