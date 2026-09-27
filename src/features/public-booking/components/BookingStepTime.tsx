import React, { useState, useEffect } from 'react'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot } from '@/features/appointments/types'
import { appointmentService } from '@/services/appointmentService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface BookingStepTimeProps {
  businessId: string
  service: Service
  selectedStaff: Staff | null
  staffList: Staff[]
  selectedDate: string
  selectedSlot: AvailableSlot | null
  conflictMessage?: string | null
  onSelectSlot: (slot: AvailableSlot, assignedStaffId?: string) => void
  onNext: () => void
  onBack: () => void
}

export const BookingStepTime: React.FC<BookingStepTimeProps> = ({
  businessId,
  service,
  selectedStaff,
  staffList,
  selectedDate,
  selectedSlot,
  conflictMessage,
  onSelectSlot,
  onNext,
  onBack,
}) => {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const effectiveStaffId = selectedStaff?.id || (staffList.length > 0 ? staffList[0].id : null)

  const fetchSlots = async () => {
    if (!effectiveStaffId) return
    setIsLoading(true)
    setFetchError(null)

    try {
      const res = await appointmentService.getAvailableSlots(
        businessId,
        effectiveStaffId,
        service.id,
        selectedDate,
        30
      )

      if (res.success && res.data) {
        setSlots(res.data)
      } else {
        setSlots([])
        if (res.error) setFetchError(res.error)
      }
    } catch (err: any) {
      setSlots([])
      setFetchError(err.message || 'Error al obtener horarios.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [businessId, effectiveStaffId, service.id, selectedDate])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Clock className="w-5 h-5 text-brand-400" />
          4. Elige el Horario
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Turnos calculados en vivo para el día <strong className="text-white">{selectedDate}</strong> (Duración: {service.duration_minutes} min).
        </p>
      </div>

      {/* Conflict Alert (if another user booked this slot concurrently) */}
      {conflictMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <p className="font-bold text-amber-100">{conflictMessage}</p>
            <p className="text-[11px] text-amber-300">
              La disponibilidad se actualizó automáticamente para mostrarte solo los turnos que quedan libres.
            </p>
          </div>
        </div>
      )}

      {fetchError && !conflictMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Available Slots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Horarios Disponibles:</span>
          <button
            type="button"
            onClick={fetchSlots}
            disabled={isLoading}
            className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 rounded-2xl bg-surface-dark/50 border border-white/5 flex flex-col items-center justify-center space-y-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-400">Verificando turnos disponibles en tiempo real...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-dark/60 border border-dashed border-white/10 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-white">No quedan horarios disponibles para esta fecha</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todos los turnos de este profesional ya fueron reservados o el negocio se encuentra cerrado. Probá seleccionando otro día o barbero.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {slots.map((slot, index) => {
              const isSelected = selectedSlot?.slot_start === slot.slot_start

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectSlot(slot, effectiveStaffId || undefined)}
                  className={`py-3 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/50 scale-[1.02]'
                      : 'bg-surface-dark border-white/10 text-slate-200 hover:border-brand-500/50 hover:bg-brand-500/10'
                  }`}
                >
                  <span className="font-extrabold text-sm tracking-tight">{slot.slot_start}</span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-brand-100 font-medium' : 'text-slate-400'}`}>
                    hasta {slot.slot_end}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Slot Recap */}
      {selectedSlot && (
        <div className="p-3.5 rounded-2xl bg-surface-dark border border-brand-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400">Horario seleccionado: </span>
              <strong className="text-white font-mono">{selectedSlot.slot_start} a {selectedSlot.slot_end}</strong>
            </div>
          </div>
          <span className="text-brand-300 font-semibold">{service.duration_minutes} min</span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la Fecha</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!selectedSlot}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Ingresar Mis Datos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
