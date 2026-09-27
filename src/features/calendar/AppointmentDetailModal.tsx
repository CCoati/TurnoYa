import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  AppointmentWithDetails,
  AppointmentStatus,
} from '@/features/appointments/types'
import { useBusiness } from '@/features/businesses/BusinessContext'
import { whatsappService } from '@/services/whatsappService'
import {
  User,
  Phone,
  Scissors,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Ban,
  Check,
  UserX,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentWithDetails | null
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => Promise<{ success: boolean; error?: string }>
  onCancelAppointment: (appointmentId: string, reason?: string) => Promise<{ success: boolean; error?: string }>
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
  onCancelAppointment,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false)
  const [cancelReason, setCancelReason] = useState<string>('')

  if (!appointment) return null

  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'
  const isPending = appointment.status === 'pending'
  const isConfirmed = appointment.status === 'confirmed'

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await onUpdateStatus(appointment.id, newStatus)
      if (res.success) {
        onClose()
      } else {
        setErrorMessage(res.error || 'Error al actualizar el estado.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await onCancelAppointment(appointment.id, cancelReason.trim() || undefined)
      if (res.success) {
        setShowCancelPrompt(false)
        onClose()
      } else {
        setErrorMessage(res.error || 'Error al cancelar la reserva.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al cancelar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pendiente de Confirmación
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Check className="w-3.5 h-3.5" />
            Completado
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            Cancelado (Horario Liberado)
          </span>
        )
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <UserX className="w-3.5 h-3.5" />
            No Asistió
          </span>
        )
    }
  }

  const { activeBusiness } = useBusiness()

  const whatsappCustomerUrl = appointment.customer_phone
    ? whatsappService.buildBusinessToCustomerUrl(appointment.customer_phone, {
        businessName: activeBusiness?.name || 'Nuestro local',
        customerName: appointment.customer_name,
        customerPhone: appointment.customer_phone,
        serviceName: appointment.service_name,
        staffName: appointment.staff_name,
        appointmentDate: appointment.appointment_date,
        startTime: appointment.start_time,
      })
    : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Detalle de la Reserva</h3>
              <p className="text-[11px] text-slate-400">ID: {appointment.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div>{getStatusBadge(appointment.status)}</div>
        </div>
      }
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer & Staff Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Customer */}
          <div className="p-3.5 rounded-xl bg-surface-dark border border-white/10 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand-400" />
              Cliente
            </div>
            <p className="text-sm font-bold text-white">{appointment.customer_name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>{appointment.customer_phone}</span>
            </div>

            {whatsappCustomerUrl && (
              <a
                href={whatsappCustomerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contactar por WhatsApp</span>
              </a>
            )}
          </div>

          {/* Staff Member */}
          <div className="p-3.5 rounded-xl bg-surface-dark border border-white/10 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand-400" />
              Profesional / Barbero
            </div>
            <p className="text-sm font-bold text-brand-300">{appointment.staff_name}</p>
            <p className="text-[11px] text-slate-400">Atención asignada</p>
          </div>
        </div>

        {/* Service & Time details */}
        <div className="p-4 rounded-xl bg-surface-dark border border-white/10 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-brand-400" />
              Servicio
            </span>
            <span className="font-semibold text-white">
              {appointment.service_name} ({appointment.service_duration_minutes} min)
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Fecha
            </span>
            <span className="font-semibold text-white">{appointment.appointment_date}</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              Horario Programado
            </span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {appointment.start_time} - {appointment.end_time}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Precio Total</span>
            <span className="text-sm font-black text-white">${appointment.service_price}</span>
          </div>
        </div>

        {/* Customer Notes if any */}
        {appointment.notes && (
          <div className="p-3 rounded-xl bg-surface-dark/60 border border-white/10 text-xs">
            <div className="flex items-center gap-1 text-slate-400 font-semibold mb-1">
              <MessageSquare className="w-3 h-3 text-brand-400" />
              Notas de la reserva:
            </div>
            <p className="text-slate-300 italic">{appointment.notes}</p>
          </div>
        )}

        {/* PostgreSQL slot info note */}
        <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-[11px] text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>
            {isCancelled
              ? 'Este horario está liberado en PostgreSQL y disponible para nuevos turnos.'
              : 'Este turno bloquea disponibilidad mediante GiST Exclusion Constraint.'}
          </span>
        </div>

        {/* Cancel Confirmation Prompt */}
        {showCancelPrompt ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3 animate-fade-in text-xs">
            <div className="flex items-start gap-2 text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">¿Confirmar cancelación de la reserva?</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  El estado pasará a <span className="font-mono text-red-300">cancelled</span> y el horario quedará liberado inmediatamente en la agenda.
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Motivo de cancelación (opcional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-dark border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelPrompt(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Volver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Confirmar Cancelación'}
              </Button>
            </div>
          </div>
        ) : (
          /* Operational Action Buttons */
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cerrar
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {/* Confirm button if pending */}
              {isPending && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={isSubmitting}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Confirmar Turno
                </Button>
              )}

              {/* Complete button if confirmed */}
              {isConfirmed && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  Marcar Completado
                </Button>
              )}

              {/* No show button if confirmed or pending */}
              {(isConfirmed || isPending) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('no_show')}
                  disabled={isSubmitting}
                  className="text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  No Asistió
                </Button>
              )}

              {/* Cancel button if not cancelled/completed */}
              {!isCancelled && !isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={isSubmitting}
                  className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  Cancelar Turno
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
