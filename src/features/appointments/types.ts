import { DbAppointment, AppointmentStatus, PaymentStatus } from '@/types/database.types'

export type { AppointmentStatus, PaymentStatus }

export interface AvailableSlot {
  slot_start: string
  slot_end: string
  slot_duration: number
  is_available: boolean
}

export interface BookAppointmentInput {
  businessId: string
  staffId: string
  serviceId: string
  appointmentDate: string // Format: YYYY-MM-DD
  startTime: string       // Format: HH:mm or HH:mm:ss
  customerName: string
  customerPhone: string
  notes?: string
}

export interface BookedAppointmentResult {
  id: string
  business_id: string
  staff_id: string
  staff_name: string
  service_id: string
  service_name: string
  customer_name: string
  customer_phone: string
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: AppointmentStatus
  notes: string | null
  created_at: string
}

export interface Appointment extends DbAppointment {
  customer_email?: string | null
  customer_profile_id?: string | null
  customer_notes?: string | null
  payment_status?: PaymentStatus
  price?: number
  currency?: string
  cancellation_reason?: string | null
  cancelled_by?: string | null
  branch_id?: string | null
}

export interface AppointmentWithDetails {
  id: string
  business_id: string
  staff_id: string
  staff_name: string
  staff_avatar_url: string | null
  service_id: string
  service_name: string
  service_duration_minutes: number
  service_price: number
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateAppointmentDTO {
  business_id: string
  service_id: string
  staff_id: string
  customer_name: string
  customer_phone: string
  appointment_date: string
  start_time: string
  end_time?: string
  notes?: string
  customer_email?: string
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus
  notes?: string
  start_time?: string
  end_time?: string
  staff_id?: string
  service_id?: string
}

export interface AppointmentFilterParams {
  business_id: string
  staff_id?: string
  service_id?: string
  status?: AppointmentStatus
  date?: string
  startDate?: string
  endDate?: string
}
