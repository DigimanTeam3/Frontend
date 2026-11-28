import { useQueryClient } from '@tanstack/react-query'
import { ja } from '@/shared/i18n/ja'
import { useAuthStore } from '@/shared/stores/authStore'

export interface LogoutButtonProps {
  className?: string
  onLoggedOut?: () => void
}

/** Logs out on this device: drops the saved token and any cached server data. */
export function LogoutButton({ className, onLoggedOut }: LogoutButtonProps) {
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()

  const handleClick = () => {
    logout()
    queryClient.clear()
    onLoggedOut?.()
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {ja.login.logout}
    </button>
  )
}
