import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type?: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-400 shrink-0" />,
  }

  const borderStyles = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-brand-500/30',
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm rounded-2xl bg-surface-900/95 backdrop-blur-md p-4 shadow-2xl border transition-all duration-300 animate-in slide-in-from-top-2',
        borderStyles[type]
      )}
    >
      <div className="pt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
        {message && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors -mr-1"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
