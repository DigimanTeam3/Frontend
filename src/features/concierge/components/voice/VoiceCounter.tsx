import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CheckIcon } from '@/features/concierge/components/icons'
import { ErrorSlip } from '@/features/concierge/components/Slips'
import { DiguBubble, YouBubble } from '@/features/concierge/components/voice/Bubbles'
import { Digu, type DiguFace, type DiguMotion } from '@/features/concierge/components/voice/Digu'
import { type MicState, MicButton } from '@/features/concierge/components/voice/MicButton'
import { ReservationCard } from '@/features/concierge/components/voice/ReservationCard'
import { VoiceTicket } from '@/features/concierge/components/voice/VoiceTicket'
import '@/features/concierge/components/voice/voice.css'
import type { ChatEntry } from '@/features/concierge/hooks/useConciergeChat'
import type { ConciergeSession } from '@/features/concierge/hooks/useConciergeSession'
import { isRecordingSupported } from '@/features/concierge/hooks/useVoiceRecorder'
import { conditionLabels } from '@/features/concierge/lib/format'
import { offersReservation, validRecommendations } from '@/features/concierge/lib/reply'
import {
  clearPendingReservation,
  peekPendingReservation,
} from '@/features/concierge/lib/savedCondition'
import { ja } from '@/shared/i18n/ja'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ConciergeConditions } from '@/shared/types/concierge'
import closeIcon from '@/shared/ui/icons/close.svg'

const t = ja.concierge.voice

type AssistantEntry = Extract<ChatEntry, { role: 'assistant' }>
type ErrorEntry = Extract<ChatEntry, { role: 'error' }>

// Ticket printing (same timing as the chat counter), then a short look before the list.
const PRINT_STAGGER_MS = 380
const PRINT_MS = 640
const ISSUED_HOLD_MS = 900
const THINKING_LINE_MS = 2800
const MOUTH_MS = 170
// Session key of the 予約券 offered again after coming back from login (reply ids are c1, c2, …).
const PENDING_RESERVATION_ID = 'pending'

/** What the counter is doing, from the conversation and the microphone. */
type Phase =
  | { kind: 'greeting' }
  | { kind: 'listening' }
  | { kind: 'thinking'; question: string | null }
  | { kind: 'reply'; entry: AssistantEntry; question: string | null }
  | { kind: 'error'; entry: ErrorEntry; question: string | null }

/**
 * The question shown above entry `index`: only a question right before it. An older question was
 * already answered, so it is never shown again (e.g. when a recording could not be read).
 */
function questionBefore(entries: ChatEntry[], index: number) {
  const entry = entries[index - 1]
  return entry?.role === 'user' ? entry.text : null
}

function usePhase(session: ConciergeSession): Phase {
  const { chat, recorder } = session
  const { entries } = chat
  if (recorder.isRecording) return { kind: 'listening' }
  if (chat.pending) {
    return {
      kind: 'thinking',
      // While the recording is being read, the words are not known yet.
      question: chat.pending === 'messages' ? questionBefore(entries, entries.length) : null,
    }
  }
  const last = entries.at(-1)
  if (last?.role === 'assistant') {
    return { kind: 'reply', entry: last, question: questionBefore(entries, entries.length - 1) }
  }
  if (last?.role === 'error') {
    // A rejected question has no slip any more (it waits in the text box); show what was sent.
    const question =
      questionBefore(entries, entries.length - 1) ??
      (last.error.kind === 'invalid' ? last.retryText : null)
    return { kind: 'error', entry: last, question }
  }
  return { kind: 'greeting' }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** ディグ's line while the server thinks: changes every few seconds so a long wait feels alive. */
function ThinkingBubble() {
  const [line, setLine] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(
      () => setLine((current) => (current + 1) % t.thinking.length),
      THINKING_LINE_MS,
    )
    return () => window.clearInterval(timer)
  }, [])
  return <DiguBubble text={t.thinking[line] ?? t.thinking[0]} />
}

/** Close: back to the previous screen in this app, or home when S16 was opened first. */
function useClose() {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/', { replace: true })
  }
}

/** Top bar (Figma 「top bar」): close, the 窓口 sign, and 「Aa 文字で」 to the chat counter. */
function VoiceTopBar({
  session,
  highlightChat,
}: {
  session: ConciergeSession
  highlightChat: boolean
}) {
  const goBack = useClose()
  return (
    <header className="sticky top-0 z-20 bg-[var(--digu-bg)] pt-[env(safe-area-inset-top)]">
      <div className="grid min-h-[52px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <button
          type="button"
          onClick={goBack}
          aria-label={ja.topBar.close}
          className="flex size-10 items-center justify-center rounded-full bg-white transition-transform duration-150 ease-out active:scale-95"
        >
          <img src={closeIcon} alt="" className="size-[18px]" />
        </button>
        <p className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--digu-pink)]" />
          <span className="text-base leading-[1.5] font-bold">{t.sign}</span>
          <span className="hidden font-mono text-[11px] font-medium tracking-[0.08em] text-[var(--digu-ink-mute)] min-[360px]:inline">
            {t.signCode}
          </span>
        </p>
        <button
          type="button"
          onClick={() => session.setView('chat')}
          disabled={session.recorder.isRecording}
          aria-label={t.toChatLabel}
          className={`flex items-center gap-1 justify-self-end rounded-full bg-white px-3 py-2 text-xs leading-[1.5] font-bold transition-transform duration-150 ease-out active:scale-95 disabled:opacity-40 ${highlightChat ? 'ring-2 ring-[var(--digu-pink)]' : ''}`}
        >
          <span aria-hidden="true">Aa</span>
          <span className="text-[var(--digu-ink-sub)]">{t.toChat}</span>
        </button>
      </div>
    </header>
  )
}

/** The counter ディグ sits behind, with the slot tickets come out of (Figma 「counter」). */
function CounterBar() {
  return (
    <div
      aria-hidden="true"
      className="relative z-[2] mx-2 -mt-2.5 flex h-[30px] items-end justify-center rounded-[10px] bg-[var(--digu-ink)] pb-[7px]"
    >
      <span className="h-1.5 w-[240px] max-w-[64%] rounded-[3px] border border-white bg-black" />
    </div>
  )
}

/** ディグ in the big window with the soft light behind it. */
function Stage({
  face,
  motion,
  size = 'lg',
  listening = false,
  children,
}: {
  face: DiguFace
  motion: DiguMotion
  size?: 'lg' | 'md'
  listening?: boolean
  children?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col justify-end">
      {/* Bubbles above ディグ */}
      <div className="relative z-[1] flex flex-col items-center gap-4 px-4 pb-5">{children}</div>
      <div className="flex justify-center">
        <div className="relative">
          <span
            aria-hidden="true"
            className={`absolute top-1/2 left-1/2 aspect-square w-[121%] -translate-x-1/2 -translate-y-1/2 rounded-full ${listening ? 'digu-glow-pulse bg-[var(--digu-pink-soft)]' : 'bg-[var(--digu-glow)]'}`}
          />
          <div className="relative">
            <Digu face={face} size={size} motion={motion} />
          </div>
        </div>
      </div>
      <CounterBar />
    </div>
  )
}

/** Conditions heard so far (Figma 「ConditionStamp」). */
function ConditionStamps({ conditions }: { conditions: ConciergeConditions | null }) {
  const labels = conditions ? conditionLabels(conditions).slice(0, 4) : []
  if (labels.length === 0) return null
  return (
    <ul className="flex flex-wrap justify-center gap-2 px-4">
      {labels.map((label, i) => (
        <li
          key={`${label}-${i}`}
          className="flex max-w-full items-center gap-1 rounded-md border border-dashed border-[var(--digu-pink)] px-2 py-[3px] text-xs leading-[1.5] font-bold text-[var(--digu-pink)]"
        >
          <CheckIcon />
          <span className="min-w-0 truncate">{label}</span>
        </li>
      ))}
    </ul>
  )
}

function Chips({
  items,
  disabled,
  onPick,
}: {
  items: readonly string[]
  disabled: boolean
  onPick: (text: string) => void
}) {
  if (items.length === 0) return null
  return (
    <ul className="flex flex-wrap justify-center gap-2 px-4">
      {items.map((item) => (
        <li key={item} className="max-w-full">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item)}
            className="min-h-9 max-w-full rounded-full border border-[var(--digu-line)] bg-white px-3.5 text-[13px] leading-[1.6] break-words transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * S16 voice counter (default view). ディグ greets, listens, sniffs around while the server
 * thinks (7〜9 s), asks back, and brings tickets in its mouth. Replies are read aloud; the
 * ticket being read gets a pink frame.
 */
export function VoiceCounter({ session }: { session: ConciergeSession }) {
  const { chat, speech, recorder, notice } = session
  const phase = usePhase(session)
  const isLoggedIn = useAuthStore((state) => state.accessToken !== null)
  const canRecord = isRecordingSupported() && !recorder.denied
  const reducedMotion = prefersReducedMotion()

  // Came back from the login screen to keep a 予約券: offer it again (once).
  const [pendingReservation] = useState(() =>
    useAuthStore.getState().accessToken !== null ? peekPendingReservation() : null,
  )
  useEffect(() => clearPendingReservation(), [])

  // Conditions of the latest answer (sent back with the next question by useConciergeChat).
  const lastReply = chat.entries.findLast((entry) => entry.role === 'assistant')
  const conditions = lastReply?.role === 'assistant' ? lastReply.reply.conditions : null

  // Found: tickets print out of the slot (k1), then ディグ reads them one by one (k2).
  const replyEntry = phase.kind === 'reply' ? phase.entry : null
  const recommendations = replyEntry ? validRecommendations(replyEntry.reply) : []
  const [issuedId, setIssuedId] = useState<string | null>(null)
  const printing = recommendations.length > 0 && replyEntry !== null && issuedId !== replyEntry.id
  const printMs = PRINT_MS + (recommendations.length - 1) * PRINT_STAGGER_MS + ISSUED_HOLD_MS
  useEffect(() => {
    if (!printing || !replyEntry) return
    const id = replyEntry.id
    const timer = window.setTimeout(() => setIssuedId(id), reducedMotion ? 0 : printMs)
    return () => window.clearTimeout(timer)
  }, [printing, replyEntry, printMs, reducedMotion])

  // Mouth moves while ディグ talks.
  const talking = replyEntry !== null && speech.speakingId === replyEntry.id
  const [mouthOpen, setMouthOpen] = useState(true)
  useEffect(() => {
    if (!talking || reducedMotion) return
    const timer = window.setInterval(() => setMouthOpen((open) => !open), MOUTH_MS)
    return () => {
      window.clearInterval(timer)
      setMouthOpen(true)
    }
  }, [talking, reducedMotion])
  const talkFace: DiguFace = talking && !mouthOpen ? 'speakingHalf' : 'speaking'

  // The ticket being read: part 0 is the answer, part n is ticket n.
  const readingIndex = talking && speech.part > 0 ? speech.part - 1 : null
  const ticketRefs = useRef<(HTMLLIElement | null)[]>([])
  useEffect(() => {
    if (readingIndex === null) return
    ticketRefs.current[readingIndex]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [readingIndex, reducedMotion])

  const busy = chat.pending !== null
  const micState: MicState = recorder.isRecording ? 'listening' : busy ? 'busy' : 'ready'
  const onPick = (text: string) => void session.sendText(text)

  const mic = (small = false) =>
    canRecord ? (
      <MicButton
        state={micState}
        onStart={session.startRecording}
        onStop={session.stopRecording}
        small={small}
      />
    ) : small ? null : (
      <button
        type="button"
        onClick={() => session.setView('chat')}
        className="flex min-h-[52px] items-center justify-center rounded-full bg-[var(--digu-ink)] px-6 text-[15px] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        {t.mic.noMic}
      </button>
    )

  // Hint above the mic: a notice from the recorder wins over the usual line.
  const hint = (line: string, tone: 'sub' | 'pink' = 'sub') => (
    <p
      role={notice ? 'alert' : undefined}
      className={`min-h-[18px] px-4 text-center text-xs leading-[1.5] font-bold ${notice ? 'text-danger' : tone === 'pink' ? 'text-[var(--digu-pink)]' : 'text-[var(--digu-ink-sub)]'}`}
    >
      {notice ?? (canRecord ? line : '')}
    </p>
  )

  const bottom = (children: ReactNode) => (
    <div className="flex flex-col items-center gap-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
      {children}
    </div>
  )

  const liveLine =
    phase.kind === 'greeting'
      ? pendingReservation && isLoggedIn
        ? t.resume
        : t.greeting
      : phase.kind === 'listening'
        ? t.hint.listening
        : phase.kind === 'thinking'
          ? t.hint.thinking
          : phase.kind === 'reply'
            ? phase.entry.reply.reply
            : ''

  let body: ReactNode

  if (phase.kind === 'reply' && recommendations.length > 0 && printing) {
    // S16-5 k1: ディグ comes back with tickets in its mouth; they print out of the slot.
    body = (
      <>
        <Stage face="happy" motion="hop">
          <DiguBubble text={t.found(recommendations.length)} status={talking ? t.speaking : null} />
        </Stage>
        <ol
          aria-label={t.ticketsLabel(recommendations.length)}
          className="flex flex-col gap-3 px-4 pt-1 pb-6"
        >
          {recommendations.map((item, i) => (
            <li key={item.event.id} className="overflow-hidden pt-1">
              <div
                className="concierge-print"
                style={{ animationDelay: `${i * PRINT_STAGGER_MS}ms` }}
              >
                <VoiceTicket
                  recommendation={item}
                  revealDelay={i * PRINT_STAGGER_MS + PRINT_MS}
                  actions={false}
                />
              </div>
            </li>
          ))}
        </ol>
      </>
    )
  } else if (phase.kind === 'reply' && recommendations.length > 0) {
    // S16-5 k2: small ディグ reads the answer, then each reason; the ticket being read is framed.
    const reading = readingIndex !== null ? recommendations[readingIndex] : undefined
    body = (
      <>
        <div className="flex items-start gap-3.5 px-4 pt-3 pb-5">
          <Digu
            face={talking ? talkFace : 'speakingHalf'}
            size="sm"
            motion={talking ? null : 'breathe'}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <DiguBubble
              tail="left"
              size="md"
              text={reading ? reading.reason : phase.entry.reply.reply}
              status={
                readingIndex !== null
                  ? t.reading(readingIndex + 1, recommendations.length)
                  : talking
                    ? t.speaking
                    : null
              }
            />
          </div>
        </div>
        <ol
          aria-label={t.ticketsLabel(recommendations.length)}
          className="flex flex-col gap-3 px-4 pb-6"
        >
          {recommendations.map((item, i) => (
            <li
              key={item.event.id}
              ref={(node) => {
                ticketRefs.current[i] = node
              }}
              className="scroll-mt-20 scroll-mb-28"
            >
              <VoiceTicket recommendation={item} reading={readingIndex === i} />
            </li>
          ))}
        </ol>
        {notice && <div className="px-4 pb-3">{hint('')}</div>}
        <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-2 bg-white px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-2px_5px_rgba(0,0,0,0.08)]">
          <Link
            to="/map"
            className="flex min-h-10 shrink-0 items-center rounded-[10px] border border-[var(--digu-line)] bg-white px-4 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            {t.mapAll}
          </Link>
          <button
            type="button"
            onClick={() => onPick(t.moreQuestion)}
            disabled={busy || recorder.isRecording}
            className="flex min-h-10 min-w-0 items-center rounded-[10px] px-3 text-sm font-bold text-[var(--digu-ink-sub)] disabled:opacity-40"
          >
            {t.more}
          </button>
          <span className="ml-auto">{mic(true)}</span>
        </div>
      </>
    )
  } else if (phase.kind === 'reply' && offersReservation(phase.entry.reply)) {
    // S16-6: nothing matched. ディグ suggests a 予約券.
    const suggestions = phase.entry.reply.suggestions.filter((s) => s.trim()).slice(0, 3)
    body = (
      <>
        <Stage face={talkFace} motion={talking ? null : 'breathe'} size="md">
          <DiguBubble text={phase.entry.reply.reply} status={talking ? t.speaking : null} />
        </Stage>
        <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
          <Chips items={suggestions} disabled={busy} onPick={onPick} />
          {notice && hint('')}
          <ReservationCard
            key={phase.entry.id}
            conditions={phase.entry.reply.conditions}
            status={session.reservationStatus(phase.entry.id)}
            onSave={() => session.saveReservation(phase.entry.id, phase.entry.reply.conditions)}
            trailing={mic(true)}
          />
        </div>
      </>
    )
  } else if (phase.kind === 'greeting' && pendingReservation && isLoggedIn) {
    // Back from login with conditions to keep.
    body = (
      <>
        <Stage face="speaking" motion="breathe" size="md">
          <DiguBubble text={t.resume} />
        </Stage>
        <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
          <ReservationCard
            conditions={pendingReservation}
            status={session.reservationStatus(PENDING_RESERVATION_ID)}
            onSave={() => session.saveReservation(PENDING_RESERVATION_ID, pendingReservation)}
            trailing={mic(true)}
          />
        </div>
      </>
    )
  } else {
    // S16-1 greeting, S16-2 listening, S16-3 thinking, S16-4 asking back, and errors.
    let face: DiguFace = 'speakingHalf'
    let motion: DiguMotion = 'breathe'
    let bubbles: ReactNode = null
    let below: ReactNode = null
    let hintLine: string = t.hint.ready
    let hintTone: 'sub' | 'pink' = 'sub'

    switch (phase.kind) {
      case 'greeting':
        bubbles = <DiguBubble text={t.greeting} />
        below = <Chips items={t.starters} disabled={busy} onPick={onPick} />
        break
      case 'listening': {
        face = 'listening'
        motion = 'lean'
        const previous = lastReply?.role === 'assistant' ? lastReply.reply.reply : t.greeting
        bubbles = (
          <>
            <div className="w-full opacity-45">
              <DiguBubble text={previous} size="md" />
            </div>
            <YouBubble text={null} />
          </>
        )
        below = <ConditionStamps conditions={conditions} />
        hintLine = t.hint.listening
        hintTone = 'pink'
        break
      }
      case 'thinking':
        face = 'thinking'
        motion = 'sniff'
        bubbles = (
          <>
            <YouBubble text={phase.question} past={phase.question !== null} />
            <ThinkingBubble />
          </>
        )
        below = <ConditionStamps conditions={conditions} />
        hintLine = t.hint.thinking
        break
      case 'reply': {
        // S16-4 asking back (clarify), or an answer without tickets.
        face = talkFace
        motion = talking ? null : 'breathe'
        const suggestions = phase.entry.reply.suggestions.filter((s) => s.trim()).slice(0, 4)
        bubbles = (
          <>
            {phase.question && <YouBubble text={phase.question} past />}
            <DiguBubble text={phase.entry.reply.reply} status={talking ? t.speaking : null} />
          </>
        )
        below = (
          <>
            <ConditionStamps conditions={conditions} />
            <Chips items={suggestions} disabled={busy} onPick={onPick} />
          </>
        )
        // 「えらんでも」 only when there is something to pick.
        if (phase.entry.reply.kind === 'clarify') {
          hintLine = suggestions.length > 0 ? t.hint.clarify : t.hint.clarifySpeak
        }
        break
      }
      case 'error':
        face = 'idle'
        bubbles = phase.question ? <YouBubble text={phase.question} past /> : null
        below = (
          <div className="flex justify-center px-4">
            <ErrorSlip
              error={phase.entry.error}
              canRetry={phase.entry.retryText !== null && !busy}
              onRetry={() => void session.retry()}
            />
          </div>
        )
        break
    }

    body = (
      <>
        <Stage face={face} motion={motion} listening={phase.kind === 'listening'}>
          {bubbles}
        </Stage>
        {bottom(
          <>
            {below}
            {hint(hintLine, hintTone)}
            {mic()}
          </>,
        )}
      </>
    )
  }

  return (
    <div className="digu-screen flex min-h-dvh flex-1 flex-col text-[var(--digu-ink)]">
      <VoiceTopBar session={session} highlightChat={!canRecord || recorder.error === 'denied'} />
      {/* ディグ's lines are announced as they change (errors announce themselves). */}
      <p aria-live="polite" className="sr-only">
        {liveLine}
      </p>
      <div className="flex flex-1 flex-col">{body}</div>
    </div>
  )
}
