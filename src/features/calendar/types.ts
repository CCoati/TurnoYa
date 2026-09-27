import { AppointmentWithDetails, AppointmentStatus } from '@/features/appointments/types'

export type CalendarViewMode = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek'

export interface CalendarResource {
  id: string
  title: string
  avatarUrl?: string | null
  phone?: string | null
}

export interface CalendarEventItem {
  id: string
  title: string
  start: string // ISO string or YYYY-MM-DDTHH:mm:ss
  end: string   // ISO string or YYYY-MM-DDTHH:mm:ss
  allDay?: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  resourceId?: string
  extendedProps: {
    appointment: AppointmentWithDetails
    status: AppointmentStatus
    customerName: string
    customerPhone: string
    serviceName: string
    servicePrice: number
    staffName: string
    notes?: string | null
  }
}

export interface CalendarDateRange {
  startStr: string // YYYY-MM-DD
  endStr: string   // YYYY-MM-DD
}
