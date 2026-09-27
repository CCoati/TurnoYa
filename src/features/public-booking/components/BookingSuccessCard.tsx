import React from 'react'
import { Business } from '@/features/businesses/types'
import { BookedAppointmentResult } from '@/features/appointments/types'
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  MessageSquare,
  Sparkles,
  Ticket,
  Copy,
  DollarSign,
} from 'lucide-react'

import { whatsappService } from '@/services/whatsappService'

interface BookingSuccessCardProps {
  business: Business
  result: BookedAppointmentResult
  price?: number
  onReset: () => void
}

export const BookingSuccessCard: React.FC<BookingSuccessCardProps> = ({
  business,
  result,
  price,
  onReset,
}) => {
  const [copied, setCopied] = React.useState(false)

  // Generate a clean, user-friendly reservation code (e.g., #TY-8942) without DB internals
  const bookingCode = React.useMemo(() => {
    if (result.id) {
      const clean = result.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      return `TY-${clean.slice(-5)}`
    }
    return `TY-${Math.floor(1000 + Math.random() * 9000)}`
  }, [result.id])

  // Build WhatsApp URL via whatsappService (handles number normalization and proper formatting)
  const whatsappUrl = React.useMemo(() => {
    if (!business.phone) return ''
    return whatsappService.buildCustomerToBusinessUrl(business.phone, {
      businessName: business.name,
      customerName: result.customer_name,
      serviceName: result.service_name,
      staffName: result.staff_name,
      appointmentDate: result.appointment_date,
      startTime: result.start_time,
      bookingCode,
    })
  }, [business.phone, business.name, result, bookingCode])

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bookingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-surface-dark border border-white/10 text-center space-y-6 animate-fade-in shadow-2xl">
      {/* Success Icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>¡Turno Agendado con Éxito!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Reserva confirmada.
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Te esperamos en <strong className="text-white">{business.name}</strong> para tu servicio.
        </p>
      </div>

      {/* Reservation Identifier Banner */}
      <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-left">
          <Ticket className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Identificador de reserva
            </span>
            <span className="font-mono font-black text-brand-300 text-base tracking-wider">
              #{bookingCode}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="px-2.5 py-1.5 rounded-lg bg-surface-dark border border-white/10 hover:border-brand-500/40 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-all"
          title="Copiar código"
        >
          <Copy className="w-3 h-3 text-brand-400" />
          <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {/* Clean Appointment Summary Ticket (No raw DB internals or UUIDs) */}
      <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-white/10 text-left space-y-3 text-xs max-w-md mx-auto">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Scissors className="w-3.5 h-3.5 text-brand-400" />
            Servicio:
          </span>
          <span className="font-bold text-white text-sm">{result.service_name}</span>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-brand-400" />
            Barbero:
          </span>
          <span className="font-semibold text-brand-300">{result.staff_name}</span>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            Fecha:
          </span>
          <span className="font-semibold text-white">{result.appointment_date}</span>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            Hora:
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {result.start_time.slice(0, 5)} - {result.end_time.slice(0, 5)}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Duración:
          </span>
          <span className="font-semibold text-slate-200">{result.duration_minutes} min</span>
        </div>

        {typeof price === 'number' && (
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Precio:
            </span>
            <span className="font-black text-emerald-400 text-sm">${price}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400">Cliente:</span>
          <span className="font-semibold text-white">
            {result.customer_name} ({result.customer_phone})
          </span>
        </div>
      </div>

      {/* WhatsApp CTA & Reset Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contactar por WhatsApp</span>
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-surface-dark text-slate-300 font-semibold text-xs transition-colors"
        >
          Agendar Otro Turno
        </button>
      </div>
    </div>
  )
}
