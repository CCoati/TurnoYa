import { supabase } from '@/lib/supabase'
import {
  AppointmentStatus,
  AvailableSlot,
  BookAppointmentInput,
  BookedAppointmentResult,
  AppointmentWithDetails,
  AppointmentFilterParams,
} from '@/features/appointments/types'
import { ApiResponse } from '@/types'

/**
 * Appointment & Booking Management Service for TurnosYa
 * Strictly scoped by business_id to enforce multi-tenant isolation alongside PostgreSQL RLS.
 * Interacts with PostgreSQL Exclusion Constraints and stored RPCs for concurrency protection.
 */
export interface IAppointmentService {
  getAvailableSlots(
    businessId: string,
    staffId: string,
    serviceId: string,
    date: string,
    slotInterval?: number
  ): Promise<ApiResponse<AvailableSlot[]>>

  bookAppointment(input: BookAppointmentInput): Promise<ApiResponse<BookedAppointmentResult>>

  getAppointments(params: AppointmentFilterParams): Promise<ApiResponse<AppointmentWithDetails[]>>

  getAppointmentById(businessId: string, appointmentId: string): Promise<ApiResponse<AppointmentWithDetails>>

  updateAppointmentStatus(
    businessId: string,
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<ApiResponse<{ id: string; status: AppointmentStatus }>>

  cancelAppointment(
    businessId: string,
    appointmentId: string,
    reason?: string
  ): Promise<ApiResponse<{ id: string; status: AppointmentStatus }>>
}

class AppointmentService implements IAppointmentService {
  /**
   * Calculate real available slots calling PostgreSQL RPC `get_available_slots`.
   * Evaluates:
   * - Business opening hours for the specific day of week
   * - Staff active state
   * - Service active state and duration
   * - Non-cancelled appointments (cancelled appointments do NOT block)
   * - Past times if date is today
   */
  async getAvailableSlots(
    businessId: string,
    staffId: string,
    serviceId: string,
    date: string,
    slotInterval: number = 30
  ): Promise<ApiResponse<AvailableSlot[]>> {
    if (!businessId || !staffId || !serviceId || !date) {
      return {
        data: null,
        error: 'Negocio, profesional, servicio y fecha son requeridos para consultar disponibilidad.',
        success: false,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_business_id: businessId,
        p_staff_id: staffId,
        p_service_id: serviceId,
        p_date: date,
        p_slot_interval: slotInterval,
      })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const formattedSlots: AvailableSlot[] = (data || []).map((slot: any) => ({
        slot_start: typeof slot.slot_start === 'string' ? slot.slot_start.slice(0, 5) : slot.slot_start,
        slot_end: typeof slot.slot_end === 'string' ? slot.slot_end.slice(0, 5) : slot.slot_end,
        slot_duration: Number(slot.slot_duration),
        is_available: Boolean(slot.is_available),
      }))

      return { data: formattedSlots, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al calcular los horarios disponibles.',
        success: false,
      }
    }
  }

  /**
   * Book an appointment calling PostgreSQL RPC `book_appointment`.
   * Fully atomic and transactional.
   * Guarantees zero double-booking even under concurrent race conditions
   * via PostgreSQL Exclusion Constraint (prevent_staff_appointment_overlap).
   */
  async bookAppointment(input: BookAppointmentInput): Promise<ApiResponse<BookedAppointmentResult>> {
    const {
      businessId,
      staffId,
      serviceId,
      appointmentDate,
      startTime,
      customerName,
      customerPhone,
      notes,
    } = input

    if (!businessId || !staffId || !serviceId || !appointmentDate || !startTime) {
      return { data: null, error: 'Todos los campos de la reserva son obligatorios.', success: false }
    }

    if (!customerName || customerName.trim().length < 2) {
      return { data: null, error: 'Ingresa el nombre del cliente (mínimo 2 caracteres).', success: false }
    }

    if (!customerPhone || customerPhone.trim().length < 6) {
      return { data: null, error: 'Ingresa un teléfono de contacto válido.', success: false }
    }

    // Format start time to HH:mm:ss if HH:mm provided
    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime

    try {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_business_id: businessId,
        p_staff_id: staffId,
        p_service_id: serviceId,
        p_appointment_date: appointmentDate,
        p_start_time: formattedStartTime,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_notes: notes ? notes.trim() : null,
      })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return {
        data: data as BookedAppointmentResult,
        error: null,
        success: true,
      }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error inesperado al agendar la reserva.',
        success: false,
      }
    }
  }

  /**
   * Retrieve appointments for a business with joined staff and service details.
   */
  async getAppointments(params: AppointmentFilterParams): Promise<ApiResponse<AppointmentWithDetails[]>> {
    if (!params.business_id) {
      return { data: null, error: 'business_id es obligatorio para consultar citas.', success: false }
    }

    try {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          staff_id,
          service_id,
          customer_name,
          customer_phone,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          created_at,
          updated_at,
          staff:staff_id (id, name, avatar_url),
          service:service_id (id, name, duration_minutes, price)
        `)
        .eq('business_id', params.business_id)

      if (params.staff_id) {
        query = query.eq('staff_id', params.staff_id)
      }

      if (params.service_id) {
        query = query.eq('service_id', params.service_id)
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      if (params.date) {
        query = query.eq('appointment_date', params.date)
      }

      if (params.startDate) {
        query = query.gte('appointment_date', params.startDate)
      }

      if (params.endDate) {
        query = query.lte('appointment_date', params.endDate)
      }

      query = query
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const appointments: AppointmentWithDetails[] = (data || []).map((item: any) => {
        const staffObj = item.staff || {}
        const serviceObj = item.service || {}

        return {
          id: item.id,
          business_id: item.business_id,
          staff_id: item.staff_id,
          staff_name: staffObj.name || 'Profesional no asignado',
          staff_avatar_url: staffObj.avatar_url || null,
          service_id: item.service_id,
          service_name: serviceObj.name || 'Servicio',
          service_duration_minutes: Number(serviceObj.duration_minutes) || 30,
          service_price: Number(serviceObj.price) || 0,
          customer_name: item.customer_name,
          customer_phone: item.customer_phone,
          appointment_date: item.appointment_date,
          start_time: typeof item.start_time === 'string' ? item.start_time.slice(0, 5) : item.start_time,
          end_time: typeof item.end_time === 'string' ? item.end_time.slice(0, 5) : item.end_time,
          status: item.status as AppointmentStatus,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }
      })

      return { data: appointments, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener las reservas.',
        success: false,
      }
    }
  }

  /**
   * Get single appointment by ID.
   */
  async getAppointmentById(businessId: string, appointmentId: string): Promise<ApiResponse<AppointmentWithDetails>> {
    if (!businessId || !appointmentId) {
      return { data: null, error: 'Parámetros insuficientes.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          staff_id,
          service_id,
          customer_name,
          customer_phone,
          appointment_date,
          start_time,
          end_time,
          status,
          notes,
          created_at,
          updated_at,
          staff:staff_id (id, name, avatar_url),
          service:service_id (id, name, duration_minutes, price)
        `)
        .eq('business_id', businessId)
        .eq('id', appointmentId)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const staffObj = (data as any).staff || {}
      const serviceObj = (data as any).service || {}

      const appointment: AppointmentWithDetails = {
        id: data.id,
        business_id: data.business_id,
        staff_id: data.staff_id,
        staff_name: staffObj.name || 'Profesional',
        staff_avatar_url: staffObj.avatar_url || null,
        service_id: data.service_id,
        service_name: serviceObj.name || 'Servicio',
        service_duration_minutes: Number(serviceObj.duration_minutes) || 30,
        service_price: Number(serviceObj.price) || 0,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        appointment_date: data.appointment_date,
        start_time: typeof data.start_time === 'string' ? data.start_time.slice(0, 5) : data.start_time,
        end_time: typeof data.end_time === 'string' ? data.end_time.slice(0, 5) : data.end_time,
        status: data.status as AppointmentStatus,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return { data: appointment, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener la cita.',
        success: false,
      }
    }
  }

  /**
   * Update appointment status.
   * Note: Changing status to 'cancelled' automatically unblocks the slot in PostgreSQL.
   */
  async updateAppointmentStatus(
    businessId: string,
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<ApiResponse<{ id: string; status: AppointmentStatus }>> {
    if (!businessId || !appointmentId || !status) {
      return { data: null, error: 'Parámetros requeridos para actualizar estado.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('id', appointmentId)
        .select('id, status')
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return {
        data: { id: data.id, status: data.status as AppointmentStatus },
        error: null,
        success: true,
      }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al cambiar estado de la reserva.',
        success: false,
      }
    }
  }

  /**
   * Cancel an appointment.
   * Instantly frees up the slot on PostgreSQL for other customers.
   */
  async cancelAppointment(
    businessId: string,
    appointmentId: string,
    reason?: string
  ): Promise<ApiResponse<{ id: string; status: AppointmentStatus }>> {
    if (!businessId || !appointmentId) {
      return { data: null, error: 'Parámetros requeridos.', success: false }
    }

    try {
      const updatePayload: Record<string, any> = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }

      if (reason) {
        updatePayload.notes = reason
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('business_id', businessId)
        .eq('id', appointmentId)
        .select('id, status')
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return {
        data: { id: data.id, status: data.status as AppointmentStatus },
        error: null,
        success: true,
      }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al cancelar la reserva.',
        success: false,
      }
    }
  }
}

export const appointmentService = new AppointmentService()
