import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { BusinessHour } from '@/features/businesses/types'
import { Clock } from 'lucide-react'

interface BusinessHoursModalProps {
  isOpen: boolean
  onClose: () => void
  businessName: string
  hours: BusinessHour[]
}

export const BusinessHoursModal: React.FC<BusinessHoursModalProps> = ({
  isOpen,
  onClose,
  businessName,
  hours,
}) => {
  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ]

  // Sort starting from Monday (1) to Sunday (0)
  const sortedHours = [...hours].sort((a, b) => {
    const aOrder = a.day_of_week === 0 ? 7 : a.day_of_week
    const bOrder = b.day_of_week === 0 ? 7 : b.day_of_week
    return aOrder - bOrder
  })

  const currentDow = new Date().getDay()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <h3 className="text-base font-bold text-white">Horarios de Atención</h3>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Horarios de atención regulares de <span className="text-white font-medium">{businessName}</span>:
        </p>

        <div className="divide-y divide-white/5 rounded-2xl bg-surface-dark border border-white/10 overflow-hidden text-xs">
          {sortedHours.map((h) => {
            const isToday = h.day_of_week === currentDow

            return (
              <div
                key={h.id || h.day_of_week}
                className={`p-3 flex items-center justify-between transition-colors ${
                  isToday ? 'bg-brand-500/10 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={isToday ? 'text-brand-300' : 'text-slate-300'}>
                    {dayNames[h.day_of_week]}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-500 text-white font-semibold">
                      Hoy
                    </span>
                  )}
                </div>

                <div>
                  {h.is_open && h.open_time && h.close_time ? (
                    <span className="font-mono text-emerald-400">
                      {h.open_time.slice(0, 5)} - {h.close_time.slice(0, 5)}
                    </span>
                  ) : (
                    <span className="text-slate-500">Cerrado</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
