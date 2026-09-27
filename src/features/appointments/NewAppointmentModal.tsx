import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AvailableSlot } from './types'
import { Staff } from '@/features/staff/types'
import { Service } from '@/features/services/types'
import { staffService } from '@/services/staffService'
import { serviceService } from '@/services/serviceService'
import { appointmentService } from '@/services/appointmentService'
import { whatsappService } from '@/services/whatsappService'
import { useBusiness } from '@/features/businesses/BusinessContext'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'

interface NewAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  onAppointmentCreated: () => void
  initialStaffId?: string
  initialDate?: string
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onAppointmentCreated,
  initialStaffId,
  initialDate,
}) => {
  const { activeBusiness } = useBusiness()

  // Data lists
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || '')

  // Date formatted as YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayString())
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  // Customer form details
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // UI state
  const [isLoadingBaseData, setIsLoadingBaseData] = useState<boolean>(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [successBooking, setSuccessBooking] = useState<any | null>(null)

  // Load active services and active staff on modal open
  useEffect(() => {
    if (isOpen && businessId) {
      loadInitialCatalog()
      setErrorMessage(null)
      setConflictWarning(null)
      setSuccessBooking(null)
      setSelectedSlot(null)
    }
  }, [isOpen, businessId])

  const loadInitialCatalog = async () => {
    setIsLoadingBaseData(true)
    try {
      const [servicesRes, staffRes] = await Promise.all([
        serviceService.getServices(businessId),
        staffService.getStaff(businessId),
      ])

      const activeServices = (servicesRes.data || []).filter((s) => s.active)
      const activeStaff = (staffRes.data || []).filter((st) => st.active)

      setServices(activeServices)
      setStaffList(activeStaff)

      if (activeServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(activeServices[0].id)
      }

      if (activeStaff.length > 0 && !selectedStaffId) {
        setSelectedStaffId(activeStaff[0].id)
      }
    } catch (err: any) {
      setErrorMessage('Error al cargar servicios y profesionales.')
    } finally {
      setIsLoadingBaseData(false)
    }
  }

  // Fetch available slots whenever Service, Staff or Date changes
  useEffect(() => {
    if (isOpen && businessId && selectedStaffId && selectedServiceId && selectedDate) {
      fetchSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [isOpen, businessId, selectedStaffId, selectedServiceId, selectedDate])

  const fetchSlots = async () => {
    setIsLoadingSlots(true)
    setConflictWarning(null)
    setSelectedSlot(null)

    try {
      const res = await appointmentService.getAvailableSlots(
        businessId,
        selectedStaffId,
        selectedServiceId,
        selectedDate,
        30
      )

      if (res.success && res.data) {
        setAvailableSlots(res.data)
      } else {
        setAvailableSlots([])
        if (res.error) {
          setErrorMessage(res.error)
        }
      }
    } catch (err: any) {
      setAvailableSlots([])
      setErrorMessage(err.message || 'Error al calcular horarios.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedStaff = staffList.find((st) => st.id === selectedStaffId)

  // Handle Booking submission
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setConflictWarning(null)

    if (!selectedService || !selectedStaff) {
      setErrorMessage('Por favor selecciona un servicio y un profesional.')
      return
    }

    if (!selectedSlot) {
      setErrorMessage('Por favor selecciona un horario disponible.')
      return
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Ingresa el nombre del cliente (mínimo 2 caracteres).')
      return
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setErrorMessage('Ingresa un teléfono válido de contacto.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await appointmentService.bookAppointment({
        businessId,
        staffId: selectedStaffId,
        serviceId: selectedServiceId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.slot_start,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      })

      if (res.success && res.data) {
        setSuccessBooking(res.data)
        onAppointmentCreated()
      } else {
        // Check for race condition / exclusion constraint conflict
        const err = res.error || 'No se pudo agendar la cita.'
        if (
          err.toLowerCase().includes('no está disponible') ||
          err.toLowerCase().includes('solapad') ||
          err.toLowerCase().includes('exclusion')
        ) {
          setConflictWarning(
            '⚠️ Conflicto de Concurrencia: Este turno acaba de ser reservado por otro usuario. La restricción de PostgreSQL (Exclusion Constraint) protegió la integridad de la agenda. Por favor refresca y elige otro horario disponible.'
          )
          fetchSlots()
        } else {
          setErrorMessage(err)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la reserva.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Date select helpers
  const handleSetRelativeDate = (offsetDays: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Nueva Reserva de Turno</h2>
            <p className="text-xs text-slate-400">
              Motor de disponibilidad en tiempo real con PostgreSQL Exclusion Constraint
            </p>
          </div>
        </div>
      }
    >
      {successBooking ? (
        <div className="p-6 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">¡Turno Agendado con Éxito!</h3>
            <p className="text-xs text-slate-400">
              La reserva quedó asentada de forma transaccional en PostgreSQL.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-dark border border-white/10 text-left space-y-2.5 max-w-md mx-auto text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Servicio:</span>
              <span className="font-semibold text-white">{successBooking.service_name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Profesional:</span>
              <span className="font-semibold text-brand-300">{successBooking.staff_name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Fecha:</span>
              <span className="font-semibold text-white">{successBooking.appointment_date}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Horario:</span>
              <span className="font-semibold text-emerald-400">
                {successBooking.start_time.slice(0, 5)} - {successBooking.end_time.slice(0, 5)} ({successBooking.duration_minutes} min)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-semibold text-white">
                {successBooking.customer_name} ({successBooking.customer_phone})
              </span>
            </div>
          </div>

          {/* Contact Customer via WhatsApp */}
          {successBooking.customer_phone && (
            <a
              href={whatsappService.buildBusinessToCustomerUrl(successBooking.customer_phone, {
                businessName: activeBusiness?.name || 'Nuestro local',
                customerName: successBooking.customer_name,
                customerPhone: successBooking.customer_phone,
                serviceName: successBooking.service_name,
                staffName: successBooking.staff_name,
                appointmentDate: successBooking.appointment_date,
                startTime: successBooking.start_time,
              })}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contactar por WhatsApp</span>
            </a>
          )}

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSuccessBooking(null)
                setSelectedSlot(null)
                setCustomerName('')
                setCustomerPhone('')
                setNotes('')
                fetchSlots()
              }}
            >
              Agendar Otro Turno
            </Button>
            <Button variant="primary" onClick={onClose}>
              Finalizar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="space-y-6">
          {isLoadingBaseData ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-400">Cargando catálogo de servicios y staff...</p>
            </div>
          ) : (
            <>
              {/* Warnings and alerts */}
              {conflictWarning && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-xs animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-200">Alerta de Concurrencia</p>
                    <p>{conflictWarning}</p>
                  </div>
                </div>
              )}

              {errorMessage && !conflictWarning && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-300 text-xs">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Service, Staff & Date */}
                <div className="space-y-4">
                  {/* 1. Service Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-brand-400" />
                      1. Selecciona el Servicio
                    </label>
                    {services.length === 0 ? (
                      <p className="text-xs text-amber-400">No hay servicios activos disponibles.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                        {services.map((srv) => (
                          <div
                            key={srv.id}
                            onClick={() => setSelectedServiceId(srv.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                              selectedServiceId === srv.id
                                ? 'bg-brand-500/15 border-brand-500 text-white shadow-sm ring-1 ring-brand-500/30'
                                : 'bg-surface-dark border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {srv.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {srv.duration_minutes} min
                                </span>
                              </div>
                            </div>
                            <div className="font-bold text-emerald-400 text-sm">
                              ${srv.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Staff Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-400" />
                      2. Profesional / Barbero
                    </label>
                    {staffList.length === 0 ? (
                      <p className="text-xs text-amber-400">No hay staff activo registrado.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {staffList.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => setSelectedStaffId(st.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 text-xs ${
                              selectedStaffId === st.id
                                ? 'bg-brand-500/15 border-brand-500 text-white ring-1 ring-brand-500/30'
                                : 'bg-surface-dark border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-xs flex-shrink-0">
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate text-white">{st.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {st.phone || 'Disponible'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Date Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      3. Fecha de la Reserva
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetRelativeDate(0)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedDate === getTodayString()
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-surface-dark text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRelativeDate(1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-dark text-slate-400 border border-white/10 hover:text-white transition-colors"
                        >
                          Mañana
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRelativeDate(2)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-dark text-slate-400 border border-white/10 hover:text-white transition-colors"
                        >
                          Pasado mañana
                        </button>
                      </div>
                      <input
                        type="date"
                        value={selectedDate}
                        min={getTodayString()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right column: Slots Grid & Customer details */}
                <div className="space-y-4">
                  {/* Slots selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        4. Horarios Disponibles ({selectedDate})
                      </label>
                      <button
                        type="button"
                        onClick={fetchSlots}
                        disabled={isLoadingSlots}
                        className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                        title="Recalcular disponibilidad"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                        Actualizar
                      </button>
                    </div>

                    {isLoadingSlots ? (
                      <div className="h-36 rounded-xl bg-surface-dark/50 border border-white/10 flex flex-col items-center justify-center p-4">
                        <LoadingSpinner size="md" />
                        <span className="text-xs text-slate-400 mt-2">
                          Calculando turnos disponibles...
                        </span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="h-36 rounded-xl bg-surface-dark/50 border border-dashed border-white/10 flex flex-col items-center justify-center p-4 text-center">
                        <Clock className="w-6 h-6 text-slate-600 mb-1.5" />
                        <p className="text-xs font-medium text-slate-300">Sin turnos disponibles</p>
                        <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                          El negocio puede estar cerrado en este día, no haber horarios de atención configurados, o el profesional estar completamente ocupado.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                        {availableSlots.map((slot, index) => {
                          const isSelected =
                            selectedSlot?.slot_start === slot.slot_start

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-2 rounded-xl text-center border transition-all text-xs flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-brand-500 border-brand-400 text-white shadow-md ring-2 ring-brand-400/50'
                                  : 'bg-surface-dark border-white/10 text-slate-300 hover:border-brand-500/50 hover:bg-brand-500/10'
                              }`}
                            >
                              <span className="font-bold text-xs">{slot.slot_start}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                                hasta {slot.slot_end}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Customer information */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <p className="text-xs font-semibold text-slate-300">
                      5. Datos del Cliente
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        label="Nombre Completo"
                        placeholder="Ej: Lucas Gomez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="text-xs"
                      />
                      <Input
                        label="Teléfono / WhatsApp"
                        placeholder="Ej: +54 9 11 5555-5555"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Comentarios sobre el turno o preferencias del cliente..."
                        className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic summary pill */}
              {selectedService && selectedStaff && selectedSlot && (
                <div className="p-3.5 rounded-xl bg-surface-dark border border-brand-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {selectedService.name} con {selectedStaff.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {selectedDate} • {selectedSlot.slot_start} a {selectedSlot.slot_end} ({selectedService.duration_minutes} min)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">
                      ${selectedService.price}
                    </div>
                    <div className="text-[10px] text-brand-300">
                      start_time + {selectedService.duration_minutes}m = end_time
                    </div>
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!selectedSlot || isSubmitting || !customerName || !customerPhone}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Agendando en PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Reserva</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  )
}
