import React from 'react'
import { Sparkles, Crown, Zap, Shield } from 'lucide-react'
import { PlanTier } from '../types'

interface PlanBadgeProps {
  planId: PlanTier
  planName?: string
  onClick?: () => void
  size?: 'sm' | 'md'
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  planId,
  planName,
  onClick,
  size = 'md',
}) => {
  const isClickable = Boolean(onClick)

  const getStyle = () => {
    switch (planId) {
      case 'business':
        return {
          bg: 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10',
          icon: <Crown className={size === 'sm' ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />,
          label: planName || 'Plan Business',
        }
      case 'pro':
        return {
          bg: 'bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-brand-500/20 text-brand-300 border-brand-500/40 shadow-brand-500/10',
          icon: <Zap className={size === 'sm' ? 'w-3 h-3 text-brand-400' : 'w-3.5 h-3.5 text-brand-400'} />,
          label: planName || 'Plan Pro',
        }
      case 'free':
      default:
        return {
          bg: 'bg-surface-elevated text-slate-300 border-white/10 shadow-black/20',
          icon: <Shield className={size === 'sm' ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />,
          label: planName || 'Plan Free',
        }
    }
  }

  const { bg, icon, label } = getStyle()

  const Component = isClickable ? 'button' : 'div'

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider transition-all shadow-md ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${bg} ${isClickable ? 'hover:scale-105 cursor-pointer hover:border-white/30' : ''}`}
      title={isClickable ? 'Ver detalles o cambiar de plan' : undefined}
    >
      {icon}
      <span>{label}</span>
      {isClickable && <Sparkles className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
    </Component>
  )
}
