import type { ButtonHTMLAttributes } from 'react'
import { buttonClassName, type ButtonStyleOptions } from '@/shared/ui/buttonStyles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

// Shared button (Figma: ui / Button). For a link that looks like a button, use buttonClassName().
export function Button({
  variant,
  size,
  shape,
  fullWidth,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = buttonClassName({ variant, size, shape, fullWidth })
  return (
    <button type={type} className={className ? `${classes} ${className}` : classes} {...rest} />
  )
}
