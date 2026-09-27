import { Business, BusinessHour } from '@/features/businesses/types'
import { Service } from '@/features/services/types'
import { Staff } from '@/features/staff/types'
import { AvailableSlot, BookedAppointmentResult } from '@/features/appointments/types'

export interface PublicBusinessData {
  business: Business
  services: Service[]
  staff: Staff[]
  hours: BusinessHour[]
}

export type BookingStep = 
  | 'service'    // 1. Servicio
  | 'staff'      // 2. Barbero
  | 'date'       // 3. Fecha
  | 'time'       // 4. Horario
  | 'customer'   // 5. Datos del cliente
  | 'confirm'    // 6. Confirmación (Resumen previo)
  | 'success'    // Después de confirmar (Ticket con identificador amigable)

export interface BookingSelectionState {
  service: Service | null
  staff: Staff | null // null means "Cualquier barbero disponible"
  date: string        // YYYY-MM-DD
  slot: AvailableSlot | null
  customerName: string
  customerPhone: string
  notes: string
  assignedStaff: Staff | null
  bookedResult: BookedAppointmentResult | null
  bookingCode?: string | null
}
