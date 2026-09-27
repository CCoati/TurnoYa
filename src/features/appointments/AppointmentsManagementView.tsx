import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useBusiness } from '@/features/businesses/BusinessContext'
import { appointmentService } from '@/services/appointmentService'
import { staffService } from '@/services/staffService'
import {
  AppointmentWithDetails,
  AppointmentStatus,
} from './types'
import { Staff } from '@/features/staff/types'
import { NewAppointmentModal } from './NewAppointmentModal'
import { whatsappService } from '@/services/whatsappService'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Plus,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertCircle,
  Check,
  Ban,
  ShieldCheck,
  CalendarDays,
  UserX,
  MessageSquare,
} from 'lucide-react'

export const AppointmentsManagementView: React.FC = () => {
  const { activeBusiness: currentBusiness } = useBusiness()

  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Filters
  const getTodayString = () => new Date().toISOString().split('T')[0]
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today')
  const [customDate, setCustomDate] = useState<string>(getTodayString())
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')

  // Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false)

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (currentBusiness?.id) {
      loadInitialData()
    }
  }, [currentBusiness?.id])

  const loadInitialData = async () => {
    if (!currentBusiness?.id) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [staffRes, appointmentsRes] = await Promise.all([
        staffService.getStaff(currentBusiness.id),
        appointmentService.getAppointments({ business_id: currentBusiness.id }),
      ])

      if (staffRes.data) {
        setStaffList(staffRes.data)
      }

      if (appointmentsRes.data) {
        setAppointments(appointmentsRes.data)
      } else if (appointmentsRes.error) {
        setErrorMessage(appointmentsRes.error)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar las reservas.')
    } finally {
      setIsLoading(false)
    }
  }

  const reloadAppointments = async () => {
    if (!currentBusiness?.id) return
    try {
      const res = await appointmentService.getAppointments({
        business_id: currentBusiness.id,
      })
      if (res.data) {
        setAppointments(res.data)
      }
    } catch (err: any) {
      console.error('Error reloading appointments:', err)
    }
  }

  // Handle appointment status change
  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus,
    customerName: string
  ) => {
    if (!currentBusiness?.id) return
    setIsUpdatingStatus(appointmentId)
    setErrorMessage(null)
    setActionSuccessMessage(null)

    try {
      const res = await appointmentService.updateAppointmentStatus(
        currentBusiness.id,
        appointmentId,
        newStatus
      )

      if (res.success) {
        const statusLabel =
          newStatus === 'confirmed'
            ? 'confirmado'
            : newStatus === 'completed'
            ? 'completado'
            : newStatus === 'cancelled'
            ? 'cancelado y horario liberado'
            : newStatus === 'no_show'
            ? 'marcado como no asistió'
            : newStatus

        setActionSuccessMessage(`Turno de ${customerName} ${statusLabel}.`)
        await reloadAppointments()
        setTimeout(() => setActionSuccessMessage(null), 4000)
      } else {
        setErrorMessage(res.error || 'No se pudo actualizar el estado.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar el turno.')
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  // Filter calculation
  const todayStr = getTodayString()
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

  const filteredAppointments = appointments.filter((apt) => {
    // 1. Date filter
    if (dateFilter === 'today' && apt.appointment_date !== todayStr) return false
    if (dateFilter === 'tomorrow' && apt.appointment_date !== tomorrowStr) return false
    if (dateFilter === 'custom' && apt.appointment_date !== customDate) return false

    // 2. Staff filter
    if (selectedStaffFilter !== 'all' && apt.staff_id !== selectedStaffFilter) return false

    // 3. Status filter
    if (selectedStatusFilter !== 'all' && apt.status !== selectedStatusFilter) return false

    return true
  })

  // Quick stats
  const totalToday = appointments.filter((a) => a.appointment_date === todayStr).length
  const totalConfirmed = appointments.filter((a) => a.status === 'confirmed').length
  const totalPending = appointments.filter((a) => a.status === 'pending').length
  const totalCompleted = appointments.filter((a) => a.status === 'completed').length
  const totalCancelled = appointments.filter((a) => a.status === 'cancelled').length

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Check className="w-3 h-3" />
            Completado
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3 text-red-400" />
            Cancelado (Liberado)
          </span>
        )
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <UserX className="w-3 h-3" />
            No Asistió
          </span>
        )
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  if (!currentBusiness) {
    return (
      <Card variant="glass" className="p-8 text-center border-white/10">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Sin Negocio Activo</h3>
        <p className="text-xs text-slate-400">
          Debes seleccionar o crear un negocio para gestionar las reservas.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-400" />
            Gestión de Turnos & Reservas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Motor de disponibilidad en tiempo real con PostgreSQL Exclusion Constraint (cero solapamientos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={reloadAppointments}
            disabled={isLoading}
            className="text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-emerald-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-dark border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Turnos Hoy</span>
          <span className="text-xl font-bold text-white mt-1">{totalToday}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-dark border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-emerald-400">Confirmados</span>
          <span className="text-xl font-bold text-emerald-300 mt-1">{totalConfirmed}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-dark border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-400">Pendientes</span>
          <span className="text-xl font-bold text-amber-300 mt-1">{totalPending}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-dark border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-blue-400">Completados</span>
          <span className="text-xl font-bold text-blue-300 mt-1">{totalCompleted}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-dark border border-white/10 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-400">Cancelados</span>
          <span className="text-xl font-bold text-slate-400 mt-1">{totalCancelled}</span>
        </div>
      </div>

      {/* Database Guarantees Badge Banner */}
      <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <p className="text-slate-300 text-[11px]">
            <strong className="text-brand-300">Protección PostgreSQL GiST:</strong> Las citas reservadas bloquean automáticamente el rango <code className="text-white bg-surface-darkest px-1 py-0.5 rounded font-mono">[start_time, end_time)</code>. Las citas en estado <code className="text-slate-400 font-mono">cancelled</code> no bloquean disponibilidad.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card variant="default" className="p-4 border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Fecha:
            </span>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-dark text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dateFilter === 'tomorrow'
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-dark text-slate-400 hover:text-white'
              }`}
            >
              Mañana
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-dark text-slate-400 hover:text-white'
              }`}
            >
              Todos los Días
            </button>

            <div className="flex items-center gap-1 ml-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value)
                  setDateFilter('custom')
                }}
                className={`px-2 py-1 rounded-lg text-xs bg-surface-dark border text-slate-300 focus:outline-none focus:border-brand-500 ${
                  dateFilter === 'custom' ? 'border-brand-500 text-white' : 'border-white/10'
                }`}
              />
            </div>
          </div>

          {/* Staff & Status Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Staff Filter */}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs bg-surface-dark border border-white/10 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="all">Todos los profesionales</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs bg-surface-dark border border-white/10 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="all">Todos los estados</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
                <option value="no_show">No Asistió</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Appointments List */}
      {isLoading ? (
        <div className="py-16 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-400 mt-3">Cargando turnos y agenda...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card variant="default" className="p-12 text-center border-dashed border-white/10">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No hay turnos para este criterio</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {dateFilter === 'today'
              ? 'No hay reservas agendadas para el día de hoy.'
              : 'No se encontraron reservas con los filtros seleccionados.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 mx-auto text-xs"
          >
            <Plus className="w-4 h-4" />
            Crear Primera Reserva
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const isCancelled = apt.status === 'cancelled'
            const isCompleted = apt.status === 'completed'
            const isPending = apt.status === 'pending'
            const isUpdating = isUpdatingStatus === apt.id

            return (
              <div
                key={apt.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCancelled
                    ? 'bg-surface-dark/40 border-white/5 opacity-75'
                    : 'bg-surface-dark border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left Info: Time, Customer & Service */}
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div
                    className={`w-20 px-2 py-2 rounded-xl text-center flex flex-col justify-center flex-shrink-0 ${
                      isCancelled
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-brand-500/15 border border-brand-500/30 text-brand-300'
                    }`}
                  >
                    <span className="font-bold text-xs">
                      {apt.start_time}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      a {apt.end_time}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5">
                      {apt.appointment_date}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isCancelled ? 'line-through text-slate-400' : 'text-white'}`}>
                        {apt.customer_name}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Scissors className="w-3 h-3 text-brand-400" />
                        {apt.service_name} ({apt.service_duration_minutes}m) • ${apt.service_price}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {apt.staff_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {apt.customer_phone}
                        </span>
                        <a
                          href={whatsappService.buildBusinessToCustomerUrl(apt.customer_phone, {
                            businessName: currentBusiness?.name || 'Nuestro local',
                            customerName: apt.customer_name,
                            customerPhone: apt.customer_phone,
                            serviceName: apt.service_name,
                            staffName: apt.staff_name,
                            appointmentDate: apt.appointment_date,
                            startTime: apt.start_time,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors"
                          title="Contactar al cliente por WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>Contactar por WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {apt.notes && (
                      <p className="text-[11px] text-slate-400 bg-surface-darkest/60 px-2 py-1 rounded-md inline-block mt-1">
                        Nota: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center">
                  {isUpdating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      {/* Confirm Button if Pending */}
                      {isPending && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'confirmed', apt.customer_name)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                          title="Confirmar Turno"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}

                      {/* Complete Button if Confirmed */}
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed', apt.customer_name)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-colors flex items-center gap-1"
                          title="Marcar como Completado"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completado
                        </button>
                      )}

                      {/* Cancel Button if not already cancelled */}
                      {!isCancelled && !isCompleted && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Seguro que deseas cancelar el turno de ${apt.customer_name}? Esta acción liberará inmediatamente el horario para otros clientes.`
                              )
                            ) {
                              handleUpdateStatus(apt.id, 'cancelled', apt.customer_name)
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-dark text-slate-400 border border-white/10 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-1"
                          title="Cancelar Turno (Libera el horario)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}

                      {/* No-show button if not cancelled/completed */}
                      {!isCancelled && !isCompleted && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'no_show', apt.customer_name)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-dark text-slate-400 border border-white/10 hover:text-orange-400 hover:border-orange-500/30 transition-colors flex items-center gap-1"
                          title="Marcar como No Asistió"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          No Asistió
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        businessId={currentBusiness.id}
        onAppointmentCreated={reloadAppointments}
      />
    </div>
  )
}
