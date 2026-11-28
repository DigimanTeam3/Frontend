import { useState } from 'react'
import { ja } from '@/shared/i18n/ja'
import type { User } from '@/shared/types/me'

export interface ProfileBlockProps {
  user: User
}

// Avatar, nickname and how the user is logged in (Figma: S15 profile). The nickname is the h1.
export function ProfileBlock({ user }: ProfileBlockProps) {
  // Remembers the URL that failed, so the initial shows instead of a broken picture.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = user.profileImage && user.profileImage !== failedUrl ? user.profileImage : null
  const initial = Array.from(user.nickname.trim())[0] ?? ''

  return (
    <div className="flex items-center gap-3.5">
      <div className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-exhibit-soft text-[22px] leading-[1.4] font-bold text-exhibit">
        {photo ? (
          <img
            src={photo}
            alt=""
            onError={() => setFailedUrl(user.profileImage)}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-[22px] leading-[1.4] font-bold break-words text-ink">
          {user.nickname}
        </h1>
        <p className="flex items-center gap-1 text-xs leading-normal text-ink-muted">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-line-brand" />
          {ja.myPage.loginStatus[user.provider]}
        </p>
      </div>
    </div>
  )
}
