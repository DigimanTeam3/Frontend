export interface InitialAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

/** Round avatar with the first letter of the nickname (no profile photos are shared). */
export function InitialAvatar({ name, size = 'md' }: InitialAvatarProps) {
  const sizeClass = size === 'sm' ? 'size-7 text-xs' : 'size-10 text-base'
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${sizeClass}`}
    >
      {Array.from(name)[0] ?? '?'}
    </span>
  )
}
