import React, { useState, useEffect } from 'react'
import { BusinessHour } from '@/features/businesses/types'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot } from '@/features/appointments/types'
import { appointmentService } from '@/services/appointmentService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

interface BookingStepDateTimeProps {
  businessId: string
  service: Service
  selectedStaff: Staff | null
  staffList: Staff[]
  hours: BusinessHour[]
  selectedDate: string
  selectedSlot: AvailableSlot | null
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: AvailableSlot, assignedStaffId?: string) => void
  onNext: () => void
  onBack: () => void
}

export const BookingStepDateTime: React.FC<BookingStepDateTimeProps> = ({
  businessId,
  service,
  selectedStaff,
  staffList,
  hours,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onNext,
  onBack,
}) => {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Generate the next 14 days for quick horizontal scrolling
  const nextDays = React.useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNumber: number; isOpen: boolean }[] = []
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dow = d.getDay()
      const businessDayHour = hours.find((h) => h.day_of_week === dow)
      const isOpen = businessDayHour ? Boolean(businessDayHour.is_open) : false

      days.push({
        dateStr,
        dayName: i === 0 ? 'Hoy' : i === 1 ? 'Mañ' : dayNames[dow],
        dayNumber: d.getDate(),
        isOpen,
      })
    }
    return days
  }, [hours])

  // Effective staff ID to query: if a specific staff was picked, use it; otherwise use first active staff
  const queryStaffId = selectedStaff?.id || (staffList.length > 0 ? staffList[0].id : null)

  useEffect(() => {
    if (businessId && queryStaffId && service.id && selectedDate) {
      fetchSlots()
    } else {
      setSlots([])
      setIsLoadingSlots(false)
    }
  }, [businessId, queryStaffId, service.id, selectedDate])

  const fetchSlots = async () => {
    if (!queryStaffId) return
    setIsLoadingSlots(true)
    setErrorMessage(null)

    try {
      const res = await appointmentService.getAvailableSlots(
        businessId,
        queryStaffId,
        service.id,
        selectedDate,
        30
      )

      if (res.success && res.data) {
        setSlots(res.data)
      } else {
        setSlots([])
        if (res.error) setErrorMessage(res.error)
      }
    } catch (err: any) {
      setSlots([])
      setErrorMessage(err.message || 'Error al consultar horarios.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  // Check if current selected date is closed
  const selectedDow = new Date(selectedDate + 'T12:00:00').getDay()
  const currentDayHour = hours.find((h) => h.day_of_week === selectedDow)
  const isSelectedDateClosed = currentDayHour ? !currentDayHour.is_open : false

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Calendar className="w-5 h-5 text-brand-400" />
          3. Elige Fecha y Horario
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {service.name} • {service.duration_minutes} min • ${service.price}
          {selectedStaff && ` con ${selectedStaff.name}`}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date Carousel (Mobile optimized scroll) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Próximos Días:</span>
          <span className="text-[11px] text-slate-500 font-mono">{selectedDate}</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {nextDays.map((day) => {
            const isSelected = selectedDate === day.dateStr

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className={`flex-shrink-0 w-16 py-2.5 px-1 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/40'
                    : day.isOpen
                    ? 'bg-surface-dark border-white/10 text-slate-300 hover:border-brand-500/40'
                    : 'bg-surface-dark/40 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className="text-lg font-black mt-0.5">{day.dayNumber}</span>
                <span className={`text-[9px] mt-0.5 font-medium ${
                  isSelected ? 'text-white' : day.isOpen ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {day.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slots Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Turnos Disponibles ({selectedDate})</span>
          </div>

          <button
            type="button"
            onClick={fetchSlots}
            disabled={isLoadingSlots}
            className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {isSelectedDateClosed ? (
          <div className="p-6 rounded-2xl bg-surface-dark/60 border border-dashed border-white/10 text-center space-y-1">
            <p className="text-sm font-bold text-slate-300">El negocio se encuentra cerrado este día</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Por favor selecciona otro día en el selector superior para ver turnos disponibles.
            </p>
          </div>
        ) : isLoadingSlots ? (
          <div className="py-12 rounded-2xl bg-surface-dark/40 border border-white/5 flex flex-col items-center justify-center space-y-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-400">Consultando disponibilidad en vivo...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-dark/60 border border-dashed border-white/10 text-center space-y-1">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-slate-300">No hay turnos disponibles para esta fecha</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Todos los horarios pueden estar ocupados o las horas restantes no alcanzan para la duración de este servicio ({service.duration_minutes} min).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {slots.map((slot, index) => {
              const isSelected = selectedSlot?.slot_start === slot.slot_start

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectSlot(slot, queryStaffId || undefined)}
                  className={`py-2.5 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-brand-500 border-brand-400 text-white shadow-md ring-2 ring-brand-400/50'
                      : 'bg-surface-dark border-white/10 text-slate-200 hover:border-brand-500/50 hover:bg-brand-500/10'
                  }`}
                >
                  <span className="font-extrabold text-xs tracking-tight">{slot.slot_start}</span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                    hasta {slot.slot_end}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
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
          disabled={!selectedSlot}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Ingresar Mis Datos</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
