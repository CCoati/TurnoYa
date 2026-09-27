import React from 'react'
import { BusinessHour } from '@/features/businesses/types'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { Calendar, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'

interface BookingStepDateProps {
  service: Service
  staff: Staff | null
  hours: BusinessHour[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onNext: () => void
  onBack: () => void
}

export const BookingStepDate: React.FC<BookingStepDateProps> = ({
  service,
  staff,
  hours,
  selectedDate,
  onSelectDate,
  onNext,
  onBack,
}) => {
  // Generate the next 21 days
  const dayOptions = React.useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNumber: number; monthName: string; isOpen: boolean }[] = []
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    for (let i = 0; i < 21; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dow = d.getDay()
      const businessDayHour = hours.find((h) => h.day_of_week === dow)
      const isOpen = businessDayHour ? Boolean(businessDayHour.is_open) : false

      days.push({
        dateStr,
        dayName: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : dayNames[dow],
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isOpen,
      })
    }
    return days
  }, [hours])

  const selectedDow = new Date(selectedDate + 'T12:00:00').getDay()
  const currentDayHour = hours.find((h) => h.day_of_week === selectedDow)
  const isSelectedDateClosed = currentDayHour ? !currentDayHour.is_open : false

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Calendar className="w-5 h-5 text-brand-400" />
          3. Elige la Fecha
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {service.name} • {staff ? `Con ${staff.name}` : 'Cualquier barbero disponible'}
        </p>
      </div>

      {/* Date Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Selecciona un día:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">O elegí en calendario:</span>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-surface-dark border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {dayOptions.slice(0, 14).map((day) => {
            const isSelected = selectedDate === day.dateStr

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/50 scale-[1.02]'
                    : day.isOpen
                    ? 'bg-surface-dark border-white/10 text-slate-200 hover:border-brand-500/40 hover:bg-surface-elevated'
                    : 'bg-surface-dark/40 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className="text-xl font-black my-0.5">{day.dayNumber}</span>
                <span className={`text-[9px] font-medium ${
                  isSelected ? 'text-brand-100' : day.isOpen ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {day.isOpen ? day.monthName : 'Cerrado'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {isSelectedDateClosed && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>El negocio permanece cerrado en la fecha seleccionada. Por favor selecciona otro día abierto.</span>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Barbero</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isSelectedDateClosed}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Ver Horarios</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
