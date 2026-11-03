import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'soft' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800',
  soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1 rounded-lg px-2.5 text-xs',
  md: 'h-10 gap-1.5 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
}

const iconSizes: Record<Size, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconOnly?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        iconOnly ? iconSizes[size] : sizes[size]
      } ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
