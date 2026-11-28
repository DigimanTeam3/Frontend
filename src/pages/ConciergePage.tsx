import { ChatCounter } from '@/features/concierge/components/ChatCounter'
import { VoiceCounter } from '@/features/concierge/components/voice/VoiceCounter'
import { useConciergeSession } from '@/features/concierge/hooks/useConciergeSession'
import '@/features/concierge/concierge.css'
import { ja } from '@/shared/i18n/ja'

// S16 AI concierge (/concierge). Opens on the voice counter: ディグ listens, sniffs out free Seoul
// events and brings them back as tickets. 「文字で」 switches to the chat counter and 「声で」 back;
// both share one conversation. Full-screen layout (BARE_PATHS) because each counter pins its own
// top and bottom bars.
export function ConciergePage() {
  const session = useConciergeSession()

  return (
    <>
      <h1 className="sr-only">{ja.screens.S16}</h1>
      {session.view === 'voice' ? (
        <VoiceCounter session={session} />
      ) : (
        <ChatCounter session={session} />
      )}
    </>
  )
}
