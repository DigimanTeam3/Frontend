import { useNavigate } from 'react-router'
import { ja } from '@/shared/i18n/ja'
import { paths } from '@/shared/lib/paths'
import { SearchIcon } from '@/shared/ui/icons/SearchIcon'
import { State } from '@/shared/ui/State'

// Shared "event not found" block for the screens under /events/:eventId/....
export function EventNotFoundState() {
  const navigate = useNavigate()
  return (
    <State
      kind="error"
      className="my-auto"
      icon={<SearchIcon />}
      title={ja.eventNotFound.title}
      body={ja.eventNotFound.body}
      action={{ label: ja.eventNotFound.home, onClick: () => navigate(paths.home()) }}
    />
  )
}
