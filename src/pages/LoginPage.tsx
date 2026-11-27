import { useNavigate, useSearchParams } from 'react-router'
import { safeRedirect } from '@/shared/lib/safeRedirect'
import { ja } from '@/shared/i18n/ja'
import { useAuthStore } from '@/shared/stores/authStore'
import { ScreenPlaceholder } from '@/shared/ui/ScreenPlaceholder'

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

// S01. LINE login comes later. In mock mode a dev button logs in so protected screens can be tested.
export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const redirectTo = safeRedirect(searchParams.get('redirect'))

  const devLogin = () => {
    setAccessToken('mock-access-token')
    navigate(redirectTo, { replace: true })
  }

  return (
    <>
      <ScreenPlaceholder screenId="S01" />
      {isMock && (
        <div className="text-center">
          <button
            type="button"
            onClick={devLogin}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            {ja.login.devLogin}
          </button>
        </div>
      )}
    </>
  )
}
