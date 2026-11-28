import { Link } from 'react-router'
import { useMyCompanionsQuery } from '@/features/mypage/api'
import { SectionError } from '@/features/mypage/components/SectionError'
import { SectionLoading } from '@/features/mypage/components/SectionLoading'
import { ja } from '@/shared/i18n/ja'
import { formatDate } from '@/shared/lib/formatDate'
import { paths } from '@/shared/lib/paths'

// My companion record: the posts I wrote and the ones I joined, under the menu row that opens
// it. Loads when it is first opened. A row leads to the companion post (S08).
export function CompanionRecordList() {
  const { companions: copy } = ja.myPage
  const { data, isPending, isError, refetch } = useMyCompanionsQuery()

  return (
    <div className="border-b border-line px-1 py-3 pl-[38px]">
      {isPending && (
        <SectionLoading>
          <div className="flex flex-col gap-3">
            {[0, 1].map((item) => (
              <div key={item} className="h-10 rounded-md bg-ink/5" />
            ))}
          </div>
        </SectionLoading>
      )}
      {isError && <SectionError onRetry={() => void refetch()} />}
      {data && data.items.length === 0 && (
        <p className="text-[13px] leading-[1.6] text-ink-muted">{copy.empty}</p>
      )}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {data.items.map((post) => (
            <li key={post.id}>
              <Link
                to={paths.companionPost(post.id)}
                className="flex items-center gap-3 rounded-lg py-1.5"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    lang={post.event.titleJa === null ? 'ko' : undefined}
                    className="text-sm leading-normal font-bold break-words text-ink"
                  >
                    {post.event.titleJa ?? post.event.title}
                  </span>
                  <span className="text-xs leading-normal text-ink-muted">
                    {copy.meta(formatDate(post.meetAt), post.memberCount, post.capacity)}
                    {!post.isMine && copy.joinedSuffix}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-[3px] text-xs leading-normal font-bold ${
                    post.status === 'OPEN'
                      ? 'bg-gate-soft text-gate-ink'
                      : 'bg-surface-2 text-ink-muted'
                  }`}
                >
                  {copy.status[post.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
