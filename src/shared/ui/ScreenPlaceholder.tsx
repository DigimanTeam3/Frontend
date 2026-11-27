import { ja } from '@/shared/i18n/ja'

type ScreenId = keyof typeof ja.screens

// Temporary content for screens that are not built yet.
export function ScreenPlaceholder({ screenId }: { screenId: ScreenId }) {
  return (
    <section className="py-12 text-center">
      <p className="mb-1 text-xs text-ink-muted">{screenId}</p>
      <h1 className="mb-2 text-xl font-bold">{ja.screens[screenId]}</h1>
      <p className="text-ink-muted">{ja.common.comingSoon}</p>
    </section>
  )
}
