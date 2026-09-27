import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'brand',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  const variants = {
    brand:
      'bg-brand-950/70 text-brand-300 border border-brand-500/30 shadow-sm',
    success:
      'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
    warning:
      'bg-amber-950/70 text-amber-300 border border-amber-500/30',
    danger:
      'bg-rose-950/70 text-rose-300 border border-rose-500/30',
    neutral:
      'bg-surface-800 text-slate-300 border border-white/10',
    outline:
      'bg-transparent text-slate-300 border border-white/20',
  }

  const dotColors = {
    brand: 'bg-brand-500 animate-pulse',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium gap-1',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center select-none uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full inline-block', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  )
}
