// Only allow paths inside this app, so ?redirect= cannot send users to another site.
export function safeRedirect(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }
  return value
}
