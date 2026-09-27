import React, { useState } from 'react'
import { usePublicBusiness } from '@/features/public-booking/hooks/usePublicBusiness'
import { PublicBusinessHeader } from '@/features/public-booking/components/PublicBusinessHeader'
import { BookingStepService } from '@/features/public-booking/components/BookingStepService'
import { BookingStepStaff } from '@/features/public-booking/components/BookingStepStaff'
import { BookingStepDate } from '@/features/public-booking/components/BookingStepDate'
import { BookingStepTime } from '@/features/public-booking/components/BookingStepTime'
import { BookingStepCustomer } from '@/features/public-booking/components/BookingStepCustomer'
import { BookingStepConfirmation } from '@/features/public-booking/components/BookingStepConfirmation'
import { BookingSuccessCard } from '@/features/public-booking/components/BookingSuccessCard'
import { BusinessHoursModal } from '@/features/public-booking/components/BusinessHoursModal'
import { BookingStep } from '@/features/public-booking/types'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot, BookedAppointmentResult } from '@/features/appointments/types'
import { appointmentService } from '@/services/appointmentService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Store, Check } from 'lucide-react'

interface PublicBookingPageProps {
  slug: string
  onNavigateToDashboard?: () => void
}

const FLOW_STEPS: { key: BookingStep; label: string; number: number }[] = [
  { key: 'service', label: 'Servicio', number: 1 },
  { key: 'staff', label: 'Barbero', number: 2 },
  { key: 'date', label: 'Fecha', number: 3 },
  { key: 'time', label: 'Horario', number: 4 },
  { key: 'customer', label: 'Datos', number: 5 },
  { key: 'confirm', label: 'Confirmación', number: 6 },
]

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({
  slug,
  onNavigateToDashboard,
}) => {
  const { businessData, isLoading, error } = usePublicBusiness(slug)

  // Booking Flow Step State
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  const getTodayString = () => new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null)

  // Customer Form (Retained across steps and collisions)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Concurrency & Collision Handling
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookedResult, setBookedResult] = useState<BookedAppointmentResult | null>(null)

  // Modals
  const [isHoursModalOpen, setIsHoursModalOpen] = useState<boolean>(false)

  // Determine current step index (1-6)
  const currentStepNumber = FLOW_STEPS.find((s) => s.key === currentStep)?.number || 1

  // Handle final booking submission with collision detection
  const handleConfirmBooking = async () => {
    if (!businessData || !selectedService || !selectedSlot) return

    setIsSubmitting(true)
    setSubmitError(null)

    // Determine staff id to book: either specifically chosen or assigned by slot picker
    const finalStaffId = selectedStaff?.id || assignedStaffId || (businessData.staff[0]?.id)

    if (!finalStaffId) {
      setSubmitError('No hay un profesional disponible para este turno.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await appointmentService.bookAppointment({
        businessId: businessData.business.id,
        staffId: finalStaffId,
        serviceId: selectedService.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.slot_start,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      })

      if (res.success && res.data) {
        setBookedResult(res.data)
        setConflictMessage(null)
        setSubmitError(null)
        setCurrentStep('success')
      } else {
        const errMsg = res.error || 'No se pudo agendar la reserva.'
        const isConflict =
          errMsg.toLowerCase().includes('no está disponible') ||
          errMsg.toLowerCase().includes('solapad') ||
          errMsg.toLowerCase().includes('exclusion') ||
          errMsg.toLowerCase().includes('ocupado') ||
          errMsg.toLowerCase().includes('reservado')

        if (isConflict) {
          // Explicit requirement:
          // "Si el horario dejó de estar disponible durante el proceso:
          //  Mostrar: 'Este horario acaba de ser reservado. Elegí otro horario.'
          //  Actualizar disponibilidad.
          //  No perder los datos introducidos por el usuario cuando sea posible."
          setConflictMessage('Este horario acaba de ser reservado. Elegí otro horario.')
          setSelectedSlot(null)
          setCurrentStep('time')
        } else {
          setSubmitError(errMsg)
        }
      }
    } catch (err: any) {
      const errMsg = err.message || ''
      const isConflict =
        errMsg.toLowerCase().includes('no está disponible') ||
        errMsg.toLowerCase().includes('solapad') ||
        errMsg.toLowerCase().includes('exclusion')

      if (isConflict) {
        setConflictMessage('Este horario acaba de ser reservado. Elegí otro horario.')
        setSelectedSlot(null)
        setCurrentStep('time')
      } else {
        setSubmitError(errMsg || 'Error inesperado al agendar la reserva.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedSlot(null)
    setAssignedStaffId(null)
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setBookedResult(null)
    setSubmitError(null)
    setConflictMessage(null)
    setCurrentStep('service')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
          <LoadingSpinner size="lg" />
        </div>
        <p className="text-sm font-semibold text-white">Cargando barbería...</p>
        <p className="text-xs text-slate-500">Conectando con base de datos en tiempo real</p>
      </div>
    )
  }

  // Error / 404 state
  if (error || !businessData) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Negocio no encontrado</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          {error || 'No pudimos encontrar la página de este negocio. Verifica que el enlace sea correcto.'}
        </p>
        {onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
          >
            Volver a TurnosYa
          </button>
        )}
      </div>
    )
  }

  const { business, services, staff, hours } = businessData

  return (
    <div className="min-h-screen bg-canvas text-white flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      <div>
        {/* Public Header */}
        <PublicBusinessHeader
          business={business}
          hours={hours}
          onOpenHoursModal={() => setIsHoursModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* 6-Step Booking Progress Bar (Steps 1 to 6) */}
          {currentStep !== 'success' && (
            <div className="mb-6 sm:mb-8 bg-surface-dark/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg">
              {/* Step indicator header: Mobile compact vs Desktop full */}
              <div className="flex items-center justify-between sm:hidden mb-2">
                <span className="text-xs font-bold text-brand-300">
                  Paso {currentStepNumber} de 6:
                </span>
                <span className="text-xs font-extrabold text-white">
                  {FLOW_STEPS.find((s) => s.key === currentStep)?.label}
                </span>
              </div>

              {/* Desktop / Tablet Step Labels */}
              <div className="hidden sm:grid grid-cols-6 gap-1 text-center text-xs font-semibold mb-2.5">
                {FLOW_STEPS.map((s) => {
                  const isActive = currentStep === s.key
                  const isCompleted = s.number < currentStepNumber
                  return (
                    <div
                      key={s.key}
                      className={`flex flex-col items-center transition-colors ${
                        isActive
                          ? 'text-brand-400 font-bold'
                          : isCompleted
                          ? 'text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className="text-[11px] truncate">
                        {s.number}. {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Step Progress Track Bar */}
              <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(currentStepNumber / 6) * 100}%` }}
                />
              </div>

              {/* Mobile micro dots indicator */}
              <div className="flex items-center justify-between mt-2.5 sm:hidden px-1">
                {FLOW_STEPS.map((s) => {
                  const isActive = currentStep === s.key
                  const isCompleted = s.number < currentStepNumber
                  return (
                    <div
                      key={s.key}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-brand-500 text-white ring-2 ring-brand-400/50 scale-110 shadow-md shadow-brand-500/30'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-surface-elevated text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 text-emerald-400" /> : s.number}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 1. Servicio */}
          {currentStep === 'service' && (
            <BookingStepService
              services={services}
              selectedService={selectedService}
              onSelectService={(srv) => {
                setSelectedService(srv)
                // If service changed, clear slots
                if (selectedService?.id !== srv.id) {
                  setSelectedSlot(null)
                }
                setTimeout(() => setCurrentStep('staff'), 120)
              }}
              onNext={() => setCurrentStep('staff')}
            />
          )}

          {/* 2. Barbero */}
          {currentStep === 'staff' && (
            <BookingStepStaff
              staffList={staff}
              selectedStaff={selectedStaff}
              onSelectStaff={(st) => {
                setSelectedStaff(st)
                setTimeout(() => setCurrentStep('date'), 120)
              }}
              onNext={() => setCurrentStep('date')}
              onBack={() => setCurrentStep('service')}
            />
          )}

          {/* 3. Fecha */}
          {currentStep === 'date' && selectedService && (
            <BookingStepDate
              service={selectedService}
              staff={selectedStaff}
              hours={hours}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              onNext={() => setCurrentStep('time')}
              onBack={() => setCurrentStep('staff')}
            />
          )}

          {/* 4. Horario */}
          {currentStep === 'time' && selectedService && (
            <BookingStepTime
              businessId={business.id}
              service={selectedService}
              selectedStaff={selectedStaff}
              staffList={staff}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              conflictMessage={conflictMessage}
              onSelectSlot={(slot, assignedId) => {
                setSelectedSlot(slot)
                if (assignedId) setAssignedStaffId(assignedId)
                setConflictMessage(null) // clear conflict alert once user picks a new slot
              }}
              onNext={() => setCurrentStep('customer')}
              onBack={() => setCurrentStep('date')}
            />
          )}

          {/* 5. Datos del cliente */}
          {currentStep === 'customer' && selectedService && selectedSlot && (
            <BookingStepCustomer
              service={selectedService}
              staff={selectedStaff}
              date={selectedDate}
              slot={selectedSlot}
              customerName={customerName}
              customerPhone={customerPhone}
              notes={notes}
              onChangeName={setCustomerName}
              onChangePhone={setCustomerPhone}
              onChangeNotes={setNotes}
              onNext={() => setCurrentStep('confirm')}
              onBack={() => setCurrentStep('time')}
            />
          )}

          {/* 6. Confirmación (Resumen detallado previo a confirmar) */}
          {currentStep === 'confirm' && selectedService && selectedSlot && (
            <BookingStepConfirmation
              service={selectedService}
              staff={selectedStaff}
              date={selectedDate}
              slot={selectedSlot}
              customerName={customerName}
              customerPhone={customerPhone}
              notes={notes}
              onConfirm={handleConfirmBooking}
              onBack={() => setCurrentStep('customer')}
              isSubmitting={isSubmitting}
              errorMessage={submitError}
            />
          )}

          {/* Post-Confirmación: Reserva Confirmada con identificador de reserva */}
          {currentStep === 'success' && bookedResult && (
            <BookingSuccessCard
              business={business}
              result={bookedResult}
              price={selectedService?.price}
              onReset={handleReset}
            />
          )}
        </main>
      </div>

      {/* Public Footer */}
      <footer className="border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500 bg-surface-darkest/40">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="flex items-center justify-center gap-1.5">
            <span>Potenciado por</span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-300">
              TurnosYa
            </span>
            <span>• Plataforma de Reservas</span>
          </p>
          <p className="text-[11px] text-slate-600">
            {business.name} utiliza TurnosYa para administrar sus turnos de forma segura y automatizada.
          </p>
        </div>
      </footer>

      {/* Business Hours Modal */}
      <BusinessHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        businessName={business.name}
        hours={hours}
      />
    </div>
  )
}
