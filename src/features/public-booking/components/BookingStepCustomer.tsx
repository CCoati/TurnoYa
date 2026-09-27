import React, { useState } from 'react'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot } from '@/features/appointments/types'
import { User, Phone, ArrowLeft, ArrowRight, AlertCircle, FileText } from 'lucide-react'

interface BookingStepCustomerProps {
  service: Service
  staff: Staff | null
  date: string
  slot: AvailableSlot
  customerName: string
  customerPhone: string
  notes: string
  onChangeName: (name: string) => void
  onChangePhone: (phone: string) => void
  onChangeNotes: (notes: string) => void
  onNext: () => void
  onBack: () => void
}

export const BookingStepCustomer: React.FC<BookingStepCustomerProps> = ({
  service,
  staff,
  date,
  slot,
  customerName,
  customerPhone,
  notes,
  onChangeName,
  onChangePhone,
  onChangeNotes,
  onNext,
  onBack,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!customerName.trim() || customerName.trim().length < 2) {
      setValidationError('Por favor ingresa tu nombre y apellido (mínimo 2 caracteres).')
      return
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setValidationError('Por favor ingresa un número de teléfono o WhatsApp válido.')
      return
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <User className="w-5 h-5 text-brand-400" />
          5. Tus Datos de Contacto
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          No necesitas registrarte. Solo requerimos tus datos para agendar tu cita y confirmarte el turno.
        </p>
      </div>

      {/* Appointment mini summary */}
      <div className="p-3.5 rounded-2xl bg-surface-dark/90 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">{service.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-brand-300">{staff ? staff.name : 'Cualquier profesional'}</span>
        </div>
        <div className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {date} • {slot.slot_start} hs
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Input fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-400" />
            Nombre y Apellido *
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Martín Palermo"
            value={customerName}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-surface-dark border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-brand-400" />
            Teléfono o WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="Ej: +54 9 11 1234-5678"
            value={customerPhone}
            onChange={(e) => onChangePhone(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-surface-dark border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Te enviaremos los recordatorios y avisos sobre tu turno a este número.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Notas o comentarios (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Ej: Degradado bajo en los laterales, peinado con cera..."
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-surface-dark border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Horarios</span>
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Revisar Resumen</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  )
}
