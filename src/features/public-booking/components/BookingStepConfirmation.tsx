import React from 'react'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot } from '@/features/appointments/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Scissors,
  User,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface BookingStepConfirmationProps {
  service: Service
  staff: Staff | null
  date: string
  slot: AvailableSlot
  customerName: string
  customerPhone: string
  notes?: string
  onConfirm: () => Promise<void>
  onBack: () => void
  isSubmitting: boolean
  errorMessage: string | null
}

export const BookingStepConfirmation: React.FC<BookingStepConfirmationProps> = ({
  service,
  staff,
  date,
  slot,
  customerName,
  customerPhone,
  notes,
  onConfirm,
  onBack,
  isSubmitting,
  errorMessage,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          6. Confirmación de tu Reserva
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Por favor revisa el resumen de tu turno antes de confirmar.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-300 text-xs animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <p className="font-bold text-red-200">No se pudo completar la reserva</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Structured Summary Ticket */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-dark border border-brand-500/30 shadow-xl space-y-4">
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Resumen del Turno
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Listo para confirmar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* 1. Servicio */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Scissors className="w-3.5 h-3.5 text-brand-400" />
              Servicio
            </span>
            <p className="font-bold text-white text-sm">{service.name}</p>
          </div>

          {/* 2. Barbero */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-brand-400" />
              Barbero / Profesional
            </span>
            <p className="font-bold text-brand-300 text-sm">
              {staff ? staff.name : 'Cualquiera disponible'}
            </p>
          </div>

          {/* 3. Fecha */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Fecha
            </span>
            <p className="font-bold text-white text-sm">{date}</p>
          </div>

          {/* 4. Hora */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              Hora
            </span>
            <p className="font-mono font-bold text-emerald-400 text-sm">
              {slot.slot_start} a {slot.slot_end}
            </p>
          </div>

          {/* 5. Duración */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Duración
            </span>
            <p className="font-semibold text-slate-200">{service.duration_minutes} minutos</p>
          </div>

          {/* 6. Precio */}
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Precio
            </span>
            <p className="font-black text-emerald-400 text-lg sm:text-xl">${service.price}</p>
          </div>
        </div>

        {/* Customer details recap */}
        <div className="pt-4 border-t border-white/10 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Cliente:</span>
            <strong className="text-white">{customerName}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              Teléfono:
            </span>
            <span className="font-mono text-slate-200">{customerPhone}</span>
          </div>
          {notes && (
            <div className="pt-1 text-[11px] text-slate-400 italic">
              "Nota: {notes}"
            </div>
          )}
        </div>
      </div>

      {/* Concurrency protection banner */}
      <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-slate-300 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span className="text-[11px]">
          Al confirmar, el turno se registra de forma exclusiva e instantánea en la agenda de la barbería.
        </span>
      </div>

      {/* Final confirmation actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Modificar Datos</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Confirmando Reserva...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar Reserva</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
