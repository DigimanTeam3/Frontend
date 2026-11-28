import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useEventCountQuery } from '@/features/events/api'
import closeIcon from '@/features/events/assets/close.svg'
import { categoryLabel } from '@/features/events/lib/eventText'
import { seoulDateString } from '@/features/events/lib/seoulDate'
import {
  AREAS,
  CATEGORIES,
  DATE_PRESETS,
  pickedDayLabel,
  toListParams,
  type DateChoice,
  type SearchFilters,
} from '@/features/events/search/searchConditions'
import { ja } from '@/shared/i18n/ja'

const isPickedDay = (date: DateChoice | undefined) =>
  date !== undefined && !(DATE_PRESETS as readonly string[]).includes(date)

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-9 items-center gap-1 rounded-full border px-3.5 text-[13px] transition-colors duration-150 ease-out ${
        selected
          ? 'border-ink bg-ink font-bold text-white'
          : 'border-line bg-surface text-ink active:bg-surface-2'
      }`}
    >
      {selected && (
        <span aria-hidden="true" className="text-[11px]">
          {ja.search.selectedMark}
        </span>
      )}
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-sm/[1.5] font-bold">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export interface FilterSheetProps {
  initial: SearchFilters
  keyword: string
  /** The search screen's "now", so the sheet counts and limits days the same way. */
  now: Date
  onApply: (filters: SearchFilters) => void
  onClose: () => void
}

// Bottom sheet with category / date / area (Figma: S03 BottomSheet（絞り込み）).
// Native <dialog>: focus stays inside, Esc closes, the page behind is inert.
export function FilterSheet({ initial, keyword, now, onApply, onClose }: FilterSheetProps) {
  const t = ja.search
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressedOutside = useRef(false)
  const [draft, setDraft] = useState<SearchFilters>(initial)
  const [showPicker, setShowPicker] = useState(isPickedDay(initial.date))
  const count = useEventCountQuery(
    toListParams({ ...draft, keyword, sort: 'date' }, null, now),
    true,
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduce && 'animate' in dialog) {
      dialog.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], {
        duration: 280,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      })
    }
    // Keep the page behind from scrolling while the sheet is open (iOS ignores the inert page).
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
      if (dialog.open) dialog.close()
    }
  }, [])

  const toggle = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: current[key] === value ? undefined : value }))

  const today = seoulDateString(now)
  const pickedDay = isPickedDay(draft.date) ? draft.date : undefined

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onPointerDown={(event) => {
        pressedOutside.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        // A tap on the dimmed area lands on the dialog element itself. Both press and release must
        // be there: a drag that starts inside the sheet and ends outside does not close it.
        if (event.target === event.currentTarget && pressedOutside.current) onClose()
      }}
      className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-app overflow-y-auto rounded-t-3xl bg-surface p-0 text-ink shadow-[0_-4px_16px_rgba(26,29,38,0.12)] backdrop:bg-ink/45"
    >
      <div className="flex flex-col gap-5 px-6 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-sm bg-line" />
        <div className="flex items-center">
          <h2 id={titleId} className="flex-1 text-[17px]/[1.4] font-extrabold">
            {t.filter}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mr-2.5 flex size-11 items-center justify-center rounded-full active:bg-ink/10"
          >
            <img src={closeIcon} alt="" width={22} height={22} />
          </button>
        </div>

        <Group title={t.category}>
          <Chip
            selected={!draft.category}
            onClick={() => setDraft({ ...draft, category: undefined })}
          >
            {t.all}
          </Chip>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={draft.category === category}
              onClick={() => toggle('category', category)}
            >
              {categoryLabel(category)}
            </Chip>
          ))}
        </Group>

        <Group title={t.date}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset}
              selected={draft.date === preset}
              onClick={() => {
                setShowPicker(false)
                toggle('date', preset)
              }}
            >
              {t.dates[preset]}
            </Chip>
          ))}
          <Chip
            selected={showPicker}
            onClick={() => {
              if (showPicker) setDraft({ ...draft, date: undefined })
              else if (!pickedDay) setDraft({ ...draft, date: undefined })
              setShowPicker(!showPicker)
            }}
          >
            {pickedDay ? pickedDayLabel(pickedDay) : t.dates.pick}
          </Chip>
          {showPicker && (
            <label className="flex w-full items-center gap-3 text-sm text-ink-muted">
              {t.pickDateLabel}
              <input
                type="date"
                min={today}
                value={pickedDay ?? ''}
                onChange={(event) => {
                  const day = event.target.value
                  // Typed past days are ignored (min only marks them invalid).
                  if (day && day < today) return
                  setDraft({ ...draft, date: (day || undefined) as DateChoice | undefined })
                }}
                className="h-11 flex-1 rounded-[10px] border border-line bg-surface-2 px-3 text-ink"
              />
            </label>
          )}
        </Group>

        <Group title={t.area}>
          {AREAS.map((area) => (
            <Chip key={area} selected={draft.area === area} onClick={() => toggle('area', area)}>
              {t.areas[area]}
            </Chip>
          ))}
        </Group>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setDraft({})
              setShowPicker(false)
            }}
            className="h-[54px] rounded-[14px] border-[1.5px] border-ink px-5 text-base font-bold active:bg-ink/5"
          >
            {t.reset}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="h-[54px] flex-1 rounded-[14px] bg-ink px-5 text-base font-bold text-white active:opacity-85"
          >
            {t.showResults(count.isSuccess && !count.isPlaceholderData ? count.data : null)}
          </button>
        </div>
      </div>
    </dialog>
  )
}
