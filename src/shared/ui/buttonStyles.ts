// Button looks from the Figma ui Button component. Kept apart from Button.tsx so links can use
// the same classes: <Link className={buttonClassName({ variant: 'primary', fullWidth: true })}>.

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'accentOutline' | 'ghost'
export type ButtonSize = 'lg' | 'sm'
export type ButtonShape = 'rounded' | 'pill'

export interface ButtonStyleOptions {
  /** primary: dark main action. accent: point color. outline / accentOutline: second action. ghost: text only. */
  variant?: ButtonVariant
  /** lg: 52px bottom-bar button. sm: 40px inline button. */
  size?: ButtonSize
  shape?: ButtonShape
  fullWidth?: boolean
}

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-bold leading-none transition-opacity duration-150 ease-out active:opacity-80 disabled:pointer-events-none disabled:opacity-40'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white',
  accent: 'bg-gate text-ink',
  outline: 'border border-line bg-surface text-ink',
  accentOutline: 'border-[1.5px] border-gate bg-surface text-gate-ink',
  ghost: 'text-ink-muted',
}

const SIZE: Record<ButtonSize, string> = {
  lg: 'h-[52px] px-5 text-[15px]',
  sm: 'h-10 px-4 text-sm',
}

const RADIUS: Record<ButtonShape, Record<ButtonSize, string>> = {
  rounded: { lg: 'rounded-[14px]', sm: 'rounded-[10px]' },
  pill: { lg: 'rounded-full', sm: 'rounded-full' },
}

export function buttonClassName({
  variant = 'primary',
  size = 'lg',
  shape = 'rounded',
  fullWidth = false,
}: ButtonStyleOptions = {}) {
  return [BASE, VARIANT[variant], SIZE[size], RADIUS[shape][size], fullWidth ? 'w-full' : '']
    .filter(Boolean)
    .join(' ')
}
