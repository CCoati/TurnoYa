import React, { useState, useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useBusiness } from '@/features/businesses/BusinessContext'
import { useCalendarAppointments } from './hooks/useCalendarAppointments'
import { AppointmentDetailModal } from './AppointmentDetailModal'
import { NewAppointmentModal } from '@/features/appointments/NewAppointmentModal'
import { CalendarViewMode } from './types'
import { AppointmentWithDetails } from '@/features/appointments/types'
import './calendar.css'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  User,
  Scissors,
  Clock,
  Filter,
  ShieldCheck,
} from 'lucide-react'

export const CalendarView: React.FC = () => {
  const { activeBusiness } = useBusiness()

  const {
    events,
    staffList,
    selectedStaffId,
    setSelectedStaffId,
    setDateRange,
    isLoading,
    errorMessage,
    updateAppointmentStatus,
    cancelAppointment,
    refetch,
  } = useCalendarAppointments({
    businessId: activeBusiness?.id,
  })

  // FullCalendar ref for programmatic navigation & view switching
  const calendarRef = useRef<any>(null)

  // Current calendar state
  const [currentView, setCurrentView] = useState<CalendarViewMode>('timeGridWeek')
  const [calendarTitle, setCalendarTitle] = useState<string>('')

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState<boolean>(false)

  // Handle FullCalendar date range & title updates
  const handleDatesSet = useCallback(
    (arg: any) => {
      setCalendarTitle(arg.view.title)
      setCurrentView(arg.view.type as CalendarViewMode)

      const start = arg.startStr.split('T')[0]
      const end = arg.endStr.split('T')[0]
      setDateRange({ startStr: start, endStr: end })
    },
    [setDateRange]
  )

  // Navigation handlers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev()
  }

  const handleNext = () => {
    calendarRef.current?.getApi().next()
  }

  const handleToday = () => {
    calendarRef.current?.getApi().today()
  }

  const handleChangeView = (view: CalendarViewMode) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view)
  }

  // Handle Event Click -> Open details modal
  const handleEventClick = (clickInfo: any) => {
    const apt: AppointmentWithDetails = clickInfo.event.extendedProps.appointment
    if (apt) {
      setSelectedAppointment(apt)
      setIsDetailModalOpen(true)
    }
  }

  // Custom Event content renderer — memoized to prevent FullCalendar re-rendering all events
  const renderEventContent = useCallback((eventInfo: any) => {
    const { event, view } = eventInfo
    const props = event.extendedProps
    const isListView = view.type.startsWith('list')
    const isMonthView = view.type.startsWith('dayGrid')

    if (isListView) {
      return (
        <div className="flex items-center justify-between w-full py-0.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{props.customerName}</span>
            <span className="text-slate-400">• {props.serviceName}</span>
            <span className="text-brand-300 font-medium text-[11px]">({props.staffName})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">${props.servicePrice}</span>
          </div>
        </div>
      )
    }

    if (isMonthView) {
      return (
        <div className="px-1 py-0.5 text-[11px] truncate flex items-center gap-1.5 w-full">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.borderColor }}
          />
          <span className="font-semibold text-white truncate">{props.customerName}</span>
          <span className="text-slate-300 text-[10px] hidden sm:inline truncate">
            {props.serviceName}
          </span>
        </div>
      )
    }

    // TimeGrid (Day & Week views)
    return (
      <div className="p-1.5 h-full flex flex-col justify-between overflow-hidden text-xs leading-tight">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="font-bold text-white truncate text-[11px]">
              {props.customerName}
            </span>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/20"
              style={{ backgroundColor: event.borderColor }}
              title={`Estado: ${props.status}`}
            />
          </div>

          <div className="text-[10px] text-slate-200 flex items-center gap-1 truncate font-medium">
            <Scissors className="w-2.5 h-2.5 text-brand-300 flex-shrink-0" />
            <span className="truncate">{props.serviceName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 mt-1 border-t border-white/10">
          <span className="flex items-center gap-0.5 font-mono">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            {eventInfo.timeText}
          </span>
          <span className="text-brand-300 font-medium truncate max-w-[45%] text-right">
            {props.staffName}
          </span>
        </div>
      </div>
    )
  }, [])

  return (
    <div className="space-y-5 animate-fade-in turnosya-calendar">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-400" />
            Agenda & Calendario Administrativo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turnos sincronizados en tiempo real para{' '}
            <span className="font-semibold text-brand-300">{activeBusiness?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Barber / Staff Filter Bar */}
      <div className="p-3 rounded-2xl bg-surface-dark border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Filtrar por Barbero:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStaffId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedStaffId === 'all'
                ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/50'
                : 'bg-surface-elevated text-slate-400 border border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            <User className="w-3 h-3" />
            Todos los Barberos ({staffList.length})
          </button>

          {staffList.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStaffId(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedStaffId === st.id
                  ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/50'
                  : 'bg-surface-elevated text-slate-400 border border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-brand-500/20 flex items-center justify-center text-[10px] text-brand-300 font-bold">
                {st.name.charAt(0).toUpperCase()}
              </div>
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Toolbar & Navigation */}
      <Card variant="default" className="p-3.5 border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Navigation buttons and Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-elevated rounded-xl border border-white/10 p-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white capitalize pl-2">
              {calendarTitle}
            </h3>
          </div>

          {/* View switcher buttons (Día, Semana, Mes, Lista) */}
          <div className="flex items-center gap-1 bg-surface-elevated rounded-xl border border-white/10 p-1 self-start sm:self-auto">
            <button
              onClick={() => handleChangeView('timeGridDay')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'timeGridDay'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => handleChangeView('timeGridWeek')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'timeGridWeek'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handleChangeView('dayGridMonth')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'dayGridMonth'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => handleChangeView('listWeek')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'listWeek'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </Card>

      {/* Calendar Grid Container */}
      <Card variant="glass" className="p-4 border-white/10 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-surface-darkest/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-brand-300 font-medium mt-2">Cargando turnos...</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        <FullCalendar
          {...({
            ref: calendarRef,
            plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
            initialView: 'timeGridWeek',
            headerToolbar: false,
            locale: 'es',
            firstDay: 1,
            allDaySlot: false,
            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            slotDuration: '00:30:00',
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            },
            eventTimeFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            },
            nowIndicator: true,
            editable: false,
            selectable: true,
            events: events,
            eventClick: handleEventClick,
            eventContent: renderEventContent,
            datesSet: handleDatesSet,
            height: 'auto',
            expandRows: true,
          } as any)}
        />
      </Card>

      {/* Status Legend */}
      <div className="p-3 rounded-xl bg-surface-dark border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-300">Estados de Turno:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300 text-[11px]">Confirmado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300 text-[11px]">Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-300 text-[11px]">Completado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-400 text-[11px]">Cancelado (Liberado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-300 text-[11px]">No Asistió</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        appointment={selectedAppointment}
        onUpdateStatus={updateAppointmentStatus}
        onCancelAppointment={cancelAppointment}
      />

      {activeBusiness?.id && (
        <NewAppointmentModal
          isOpen={isNewBookingModalOpen}
          onClose={() => setIsNewBookingModalOpen(false)}
          businessId={activeBusiness.id}
          initialStaffId={selectedStaffId !== 'all' ? selectedStaffId : undefined}
          onAppointmentCreated={refetch}
        />
      )}
    </div>
  )
}
