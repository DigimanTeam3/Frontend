import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
    return {
      kind: 'reply',
      entry: last,
      question: questionBefore(entries, entries.length - 1),
    }
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

// Bubbles that move when one comes in or goes away slide to their new place (no jump).
const SLIDE_MS = 220

/** One line in the bubble column. `key` follows the line across states so it can slide. */
interface BubbleLine {
  key: string
  node: ReactNode
  /** Kept above the new line, dimmed (the last answer while the visitor talks). */
  dim?: boolean
}

/**
 * The lines above ディグ, newest at the bottom right above its head. The column has a fixed
 * place, so lines coming and going never move ディグ; when they do not fit, the column scrolls
 * under a soft top edge. It stops growing at 300px, so on a tall screen ディグ stays near
 * the top and the extra room is left below it.
 */
function BubbleColumn({ lines, reducedMotion }: { lines: BubbleLine[]; reducedMotion: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const topsRef = useRef(new Map<string, number>())
  const keysRef = useRef('')
  const keys = lines.map((line) => line.key).join('|')

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    // A new line: show the newest one.
    if (keysRef.current !== keys) box.scrollTop = box.scrollHeight
    keysRef.current = keys
    const tops = new Map<string, number>()
    for (const node of box.querySelectorAll<HTMLElement>('[data-line]')) {
      const key = node.dataset.line ?? ''
      const top = node.offsetTop - box.scrollTop
      tops.set(key, top)
      const before = topsRef.current.get(key)
      if (before === undefined || reducedMotion || Math.abs(before - top) < 1) continue
      node.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], {
        duration: SLIDE_MS,
        easing: 'ease-out',
      })
    }
    topsRef.current = tops
  })

  return (
    <div
      ref={boxRef}
      className="digu-bubbles relative z-[1] flex max-h-[300px] min-h-0 flex-1 flex-col overflow-y-auto px-4"
    >
      <div className="mt-auto flex flex-col gap-4 pt-4 pb-5">
        {lines.map((line) => (
          <div
            key={line.key}
            data-line={line.key}
            className={`flex flex-col transition-opacity duration-200 ease-out motion-reduce:transition-none ${line.dim ? 'opacity-45' : ''}`}
          >
            {line.node}
          </div>
        ))}
      </div>
    </div>
  )
}

// Height of the area under ディグ (chips, hint and mic; or the 予約券; or printing tickets).
// Fixed, so ディグ stays put whatever is shown there.
const DOCK = 'h-[calc(236px+max(20px,env(safe-area-inset-bottom)))]'

/**
 * The frame used by every state except the ticket list: bubbles on top, ディグ in a fixed
 * place, and a fixed-height dock below. Only what is inside each part changes.
 */
function Stage({
  face,
  motion,
  smooth,
  listening,
  lines,
  dock,
  dockOpen = false,
  reducedMotion,
}: {
  face: DiguFace
  motion: DiguMotion
  smooth: boolean
  listening: boolean
  lines: BubbleLine[]
  dock: ReactNode
  /** Let the dock's content run on below it (tickets printing out on a tall screen). */
  dockOpen?: boolean
  reducedMotion: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BubbleColumn lines={lines} reducedMotion={reducedMotion} />
      <div className="flex shrink-0 justify-center">
        <div className="relative">
          <span
            aria-hidden="true"
            className={`absolute top-1/2 left-1/2 aspect-square w-[121%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none ${listening ? 'bg-[var(--digu-pink-soft)]' : 'bg-[var(--digu-glow)]'}`}
          />
          <div className="relative">
            <Digu face={face} size="lg" motion={motion} smooth={smooth} />
          </div>
        </div>
      </div>
      <div className={`relative shrink-0 ${dockOpen ? '' : 'overflow-hidden'} ${DOCK}`}>{dock}</div>
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

  // Hint above the mic: a notice from the recorder wins over the usual line. Two lines are kept
  // for it, so a longer notice does not push the mic down.
  const hintText = notice ?? (canRecord ? null : '')
  const hint = (line: string, tone: 'sub' | 'pink' = 'sub') => (
    <p
      key={hintText ?? line}
      role={notice ? 'alert' : undefined}
      className={`digu-fade flex h-9 shrink-0 items-end justify-center px-4 text-center text-xs leading-[1.5] font-bold ${notice ? 'text-danger' : tone === 'pink' ? 'text-[var(--digu-pink)]' : 'text-[var(--digu-ink-sub)]'}`}
    >
      {hintText ?? line}
    </p>
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

  // Keys that follow each line across states (see BubbleColumn): the visitor's question is keyed
  // by the place its entry has (or will have) in the conversation, ディグ's lines by reply id.
  const count = chat.entries.length
  const youLine = (key: string, text: string | null, past: boolean): BubbleLine => ({
    key: `you:${key}`,
    node: <YouBubble text={text} past={past} />,
  })
  const askedLine =
    phase.kind !== 'greeting' && phase.kind !== 'listening' && phase.question !== null
      ? youLine(
          phase.kind === 'thinking' ? String(count - 1) : String(count - 2),
          phase.question,
          true,
        )
      : null

  let body: ReactNode

  if (phase.kind === 'reply' && recommendations.length > 0 && !printing) {
    // S16-5 k2: small ディグ reads the answer, then each reason; the ticket being read is framed.
    const reading = readingIndex !== null ? recommendations[readingIndex] : undefined
    body = (
      <div key="tickets" className="digu-fade flex flex-1 flex-col">
        <div className="flex items-start gap-3.5 px-4 pt-3 pb-5">
          <Digu
            face={talking ? talkFace : 'speakingHalf'}
            size="sm"
            motion={talking ? null : 'breathe'}
            smooth={!talking}
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
      </div>
    )
  } else {
    // Every other state shares one frame; only the lines, ディグ's face and the dock change.
    let face: DiguFace = 'speakingHalf'
    let motion: DiguMotion = 'breathe'
    const lines: BubbleLine[] = []
    // Dock: the 予約券 or printing tickets in place of the chips / hint / mic.
    let dock: ReactNode = null
    let dockKey = 'talk'
    let slot: ReactNode = null
    let slotKey = 'none'
    let hintLine: string = t.hint.ready
    let hintTone: 'sub' | 'pink' = 'sub'

    const reservation = (id: string, keep: ConciergeConditions) => (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-3">
        {notice && <div className="pb-2">{hint('')}</div>}
        <ReservationCard
          key={id}
          conditions={keep}
          status={session.reservationStatus(id)}
          onSave={() => session.saveReservation(id, keep)}
          trailing={mic(true)}
        />
      </div>
    )

    switch (phase.kind) {
      case 'greeting':
        if (pendingReservation && isLoggedIn) {
          // Back from login with conditions to keep.
          face = 'speaking'
          lines.push({
            key: 'digu:resume',
            node: <DiguBubble text={t.resume} />,
          })
          dockKey = 'reservation'
          dock = reservation(PENDING_RESERVATION_ID, pendingReservation)
          break
        }
        lines.push({
          key: 'digu:greeting',
          node: <DiguBubble text={t.greeting} />,
        })
        slotKey = 'starters'
        slot = <Chips items={t.starters} disabled={busy} onPick={onPick} />
        break
      case 'listening': {
        face = 'listening'
        motion = 'lean'
        lines.push({
          key: lastReply ? `digu:${lastReply.id}` : 'digu:greeting',
          node: (
            <DiguBubble
              text={lastReply?.role === 'assistant' ? lastReply.reply.reply : t.greeting}
            />
          ),
          dim: true,
        })
        lines.push(youLine(String(count), null, false))
        slotKey = 'stamps'
        slot = <ConditionStamps conditions={conditions} />
        hintLine = t.hint.listening
        hintTone = 'pink'
        break
      }
      case 'thinking':
        face = 'thinking'
        motion = 'sniff'
        lines.push(askedLine ?? youLine(String(count), null, false))
        lines.push({ key: 'digu:thinking', node: <ThinkingBubble /> })
        slotKey = 'stamps'
        slot = <ConditionStamps conditions={conditions} />
        hintLine = t.hint.thinking
        break
      case 'reply': {
        face = printing ? 'happy' : talkFace
        motion = talking ? null : 'breathe'
        if (askedLine) lines.push(askedLine)
        const { entry } = phase
        if (printing) {
          // S16-5 k1: ディグ comes back with tickets in its mouth; they print out of the slot.
          lines.push({
            key: `digu:${entry.id}`,
            node: (
              <DiguBubble
                text={t.found(recommendations.length)}
                status={talking ? t.speaking : null}
              />
            ),
          })
          dockKey = 'printing'
          dock = (
            <ol
              aria-label={t.ticketsLabel(recommendations.length)}
              className="flex h-full flex-col gap-3 px-4"
            >
              {recommendations.map((item, i) => (
                <li key={item.event.id} className="shrink-0 overflow-hidden pt-1">
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
          )
          break
        }
        lines.push({
          key: `digu:${entry.id}`,
          node: <DiguBubble text={entry.reply.reply} status={talking ? t.speaking : null} />,
        })
        if (offersReservation(entry.reply)) {
          // S16-6: nothing matched. ディグ suggests a 予約券.
          const suggestions = entry.reply.suggestions.filter((s) => s.trim()).slice(0, 3)
          if (suggestions.length > 0) {
            lines.push({
              key: `chips:${entry.id}`,
              node: (
                <div className="-mx-4">
                  <Chips items={suggestions} disabled={busy} onPick={onPick} />
                </div>
              ),
            })
          }
          dockKey = `reservation:${entry.id}`
          dock = reservation(entry.id, entry.reply.conditions)
          break
        }
        // S16-4 asking back (clarify), or an answer without tickets.
        const suggestions = entry.reply.suggestions.filter((s) => s.trim()).slice(0, 4)
        slotKey = `reply:${entry.id}`
        slot = (
          <div className="flex flex-col gap-2">
            <ConditionStamps conditions={conditions} />
            <Chips items={suggestions} disabled={busy} onPick={onPick} />
          </div>
        )
        // 「えらんでも」 only when there is something to pick.
        if (entry.reply.kind === 'clarify') {
          hintLine = suggestions.length > 0 ? t.hint.clarify : t.hint.clarifySpeak
        }
        break
      }
      case 'error':
        face = 'idle'
        if (askedLine) lines.push(askedLine)
        lines.push({
          key: `error:${phase.entry.id}`,
          node: (
            <ErrorSlip
              error={phase.entry.error}
              canRetry={phase.entry.retryText !== null && !busy}
              onRetry={() => void session.retry()}
            />
          ),
        })
        break
    }

    // S16-1 greeting, S16-2 listening, S16-3 thinking, S16-4 asking back, k1, S16-6 and errors.
    body = (
      <Stage
        face={face}
        motion={motion}
        smooth={!talking}
        listening={phase.kind === 'listening'}
        lines={lines}
        dockOpen={dockKey === 'printing'}
        reducedMotion={reducedMotion}
        dock={
          <div key={dockKey} className="digu-fade h-full">
            {dock ?? (
              <div className="flex h-full flex-col items-center gap-3 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
                <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
                  <div key={slotKey} className="digu-fade mt-auto">
                    {slot}
                  </div>
                </div>
                {hint(hintLine, hintTone)}
                <div className="flex h-[76px] w-full shrink-0 items-center justify-center">
                  {mic()}
                </div>
              </div>
            )}
          </div>
        }
      />
    )
  }

  // The frame is exactly one screen tall (flex-none: long lines must not stretch it); the ticket
  // list scrolls as a page.
  const framed = !(phase.kind === 'reply' && recommendations.length > 0 && !printing)

  return (
    <div
      className={`digu-screen digu-fade flex flex-col text-[var(--digu-ink)] ${framed ? 'h-dvh flex-none overflow-hidden' : 'min-h-dvh flex-1'}`}
    >
      <VoiceTopBar session={session} highlightChat={!canRecord || recorder.error === 'denied'} />
      {/* ディグ's lines are announced as they change (errors announce themselves). */}
      <p aria-live="polite" className="sr-only">
        {liveLine}
      </p>
      <div className="flex min-h-0 flex-1 flex-col">{body}</div>
    </div>
  )
}
