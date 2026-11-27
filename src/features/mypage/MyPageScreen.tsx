import { useMeQuery, useMySummaryQuery } from '@/features/mypage/api'
import { BadgeSection } from '@/features/mypage/components/BadgeSection'
import { CardSection } from '@/features/mypage/components/CardSection'
import { MenuList } from '@/features/mypage/components/MenuList'
import { ProfileBlock } from '@/features/mypage/components/ProfileBlock'
import { StatsCard } from '@/features/mypage/components/StatsCard'
import { ja } from '@/shared/i18n/ja'
import { apiErrorCode } from '@/shared/lib/apiError'
import { State } from '@/shared/ui/State'

// My Page (/me, Figma: S15 My Page): profile, counts, badges, memory cards and the menu. The
// profile and the counts decide the whole screen; the badges, cards and participations load and
// fail on their own.
export function MyPageScreen() {
  const meQuery = useMeQuery()
  const summaryQuery = useMySummaryQuery()
  const user = meQuery.data
  const summary = summaryQuery.data

  if (meQuery.isError || summaryQuery.isError) {
    // Sign-in trouble has its own copy; network and server errors share the generic one.
    const code = apiErrorCode(meQuery.error ?? summaryQuery.error)
    const copy = code === 'UNAUTHORIZED' ? ja.myPage.errors.UNAUTHORIZED : ja.myPage.errors.UNKNOWN
    const retry = () => {
      if (meQuery.isError) void meQuery.refetch()
      if (summaryQuery.isError) void summaryQuery.refetch()
    }
    return (
      <section className="flex flex-1 flex-col">
        <h1 className="sr-only">{ja.myPage.screenName}</h1>
        <State
          kind="error"
          title={copy.title}
          body={copy.body}
          onRetry={retry}
          className="my-auto"
        />
      </section>
    )
  }

  if (!user || !summary) {
    return (
      <section className="flex flex-1 flex-col">
        <h1 className="sr-only">{ja.myPage.screenName}</h1>
        <State kind="loading" />
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col gap-6 pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <ProfileBlock user={user} />
      <StatsCard summary={summary} />
      <BadgeSection />
      <CardSection />
      <MenuList summary={summary} />
    </section>
  )
}
