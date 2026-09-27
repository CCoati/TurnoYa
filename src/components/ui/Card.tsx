import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'bordered'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-surface-900 border border-white/10 shadow-card-dark rounded-2xl',
      glass:
        'glass-panel rounded-2xl shadow-card-dark',
      interactive:
        'bg-surface-900 border border-white/10 shadow-card-dark rounded-2xl transition-all duration-200 hover:border-brand-500/40 hover:shadow-brand-glow hover:-translate-y-0.5 cursor-pointer',
      bordered:
        'bg-surface-950/70 border border-brand-500/30 rounded-2xl shadow-brand-sm',
    }

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('px-6 py-5 border-b border-white/5', className)} {...props} />
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn('text-lg font-semibold text-slate-100 tracking-tight', className)}
    {...props}
  />
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn('text-sm text-slate-400 mt-1', className)} {...props} />
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6', className)} {...props} />

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('px-6 py-4 bg-surface-950/40 border-t border-white/5 flex items-center justify-between', className)}
    {...props}
  />
)
