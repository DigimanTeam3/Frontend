import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import backIcon from '@/features/events/assets/back.svg'
import lanternImage from '@/features/events/assets/lantern.svg'
import shareIcon from '@/features/events/assets/share.svg'
import { ja } from '@/shared/i18n/ja'

// Only show images served over https; anything else falls back to the placeholder.
function safeImageUrl(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

const ROUND_BUTTON =
  'flex size-10 items-center justify-center rounded-full bg-surface shadow-sm active:opacity-80'

export interface EventHeroProps {
  imageUrl: string | null
  shareTitle: string
}

export function EventHero({ imageUrl, shareTitle }: EventHeroProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const src = safeImageUrl(imageUrl) ?? lanternImage

  // Opened directly (shared link, LINE message): there is no page to go back to.
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  const share = async () => {
    const url = window.location.href
    // Not every browser has the share sheet (desktop Firefox, some in-app browsers).
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, url })
      } catch {
        // Closing the share sheet rejects; nothing to do.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (e.g. in-app browser); leave the page as is.
    }
  }

  return (
    <div className="relative h-[320px] overflow-hidden">
      <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-x-0 top-0 h-[120px] bg-linear-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label={ja.eventDetail.back}
          className={ROUND_BUTTON}
        >
          <img src={backIcon} alt="" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label={ja.eventDetail.share}
          className={ROUND_BUTTON}
        >
          <img src={shareIcon} alt="" width={20} height={20} />
        </button>
      </div>
      {copied && (
        <p
          role="status"
          className="absolute top-[calc(env(safe-area-inset-top)+64px)] right-4 rounded-lg bg-ink px-3 py-1.5 text-xs text-surface"
        >
          {ja.eventDetail.linkCopied}
        </p>
      )}
    </div>
  )
}
