import { useState, useEffect, useCallback, useMemo } from 'react'
import { appointmentService } from '@/services/appointmentService'
import { staffService } from '@/services/staffService'
import { Staff } from '@/features/staff/types'
import {
  AppointmentWithDetails,
  AppointmentStatus,
} from '@/features/appointments/types'
import {
  CalendarEventItem,
  CalendarResource,
  CalendarDateRange,
} from '../types'

interface UseCalendarAppointmentsProps {
  businessId: string | undefined
}

export function useCalendarAppointments({ businessId }: UseCalendarAppointmentsProps) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all')
  const [dateRange, setDateRange] = useState<CalendarDateRange | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // 1. Load active staff for the business
  const loadStaff = useCallback(async () => {
    if (!businessId) return
    try {
      const res = await staffService.getStaff(businessId)
      if (res.data) {
        setStaffList(res.data.filter((s) => s.active))
      }
    } catch (err: any) {
      console.error('Error fetching staff list for calendar:', err)
    }
  }, [businessId])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  // 2. Load appointments scoped to business and active date range
  // Note: we fetch ALL appointments for the date range and filter by staff client-side
  // to avoid unnecessary Supabase roundtrips when switching the staff filter
  const loadAppointments = useCallback(async () => {
    if (!businessId) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const params: any = {
        business_id: businessId,
      }

      if (dateRange?.startStr) {
        params.startDate = dateRange.startStr
      }
      if (dateRange?.endStr) {
        params.endDate = dateRange.endStr
      }
      // Intentionally NOT filtering by staff_id here — done client-side in useMemo below

      const res = await appointmentService.getAppointments(params)

      if (res.success && res.data) {
        setAppointments(res.data)
      } else {
        setAppointments([])
        if (res.error) setErrorMessage(res.error)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar las reservas del calendario.')
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [businessId, dateRange])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // 3. Map staff to FullCalendar resources for multi-barber support
  const resources: CalendarResource[] = useMemo(() => {
    return staffList.map((st) => ({
      id: st.id,
      title: st.name,
      avatarUrl: st.avatar_url,
      phone: st.phone,
    }))
  }, [staffList])

  // 4. Transform appointments into FullCalendar Event objects
  // Filter by selectedStaffId client-side to avoid re-fetching from Supabase
  const events: CalendarEventItem[] = useMemo(() => {
    const filtered = selectedStaffId === 'all'
      ? appointments
      : appointments.filter((apt) => apt.staff_id === selectedStaffId)

    return filtered.map((apt) => {
      // Color styling based on status
      let bg = '#065F46'
      let border = '#10B981'
      let text = '#FFFFFF'

      if (apt.status === 'pending') {
        bg = '#78350F'
        border = '#F59E0B'
        text = '#FEF3C7'
      } else if (apt.status === 'completed') {
        bg = '#1E3A8A'
        border = '#3B82F6'
        text = '#DBEAFE'
      } else if (apt.status === 'cancelled') {
        bg = '#1E293B'
        border = '#475569'
        text = '#94A3B8'
      } else if (apt.status === 'no_show') {
        bg = '#7C2D12'
        border = '#F97316'
        text = '#FFEDD5'
      }

      // Format ISO string from appointment_date + start_time / end_time
      const startTime = apt.start_time.length === 5 ? `${apt.start_time}:00` : apt.start_time
      const endTime = apt.end_time.length === 5 ? `${apt.end_time}:00` : apt.end_time
      const startIso = `${apt.appointment_date}T${startTime}`
      const endIso = `${apt.appointment_date}T${endTime}`

      return {
        id: apt.id,
        title: `${apt.customer_name} • ${apt.service_name}`,
        start: startIso,
        end: endIso,
        backgroundColor: bg,
        borderColor: border,
        textColor: text,
        resourceId: apt.staff_id,
        extendedProps: {
          appointment: apt,
          status: apt.status,
          customerName: apt.customer_name,
          customerPhone: apt.customer_phone,
          serviceName: apt.service_name,
          servicePrice: apt.service_price,
          staffName: apt.staff_name,
          notes: apt.notes,
        },
      }
    })
  }, [appointments, selectedStaffId])

  // 5. Update appointment status
  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, newStatus: AppointmentStatus) => {
      if (!businessId) return { success: false, error: 'Sin negocio activo' }
      setIsUpdatingStatus(appointmentId)

      try {
        const res = await appointmentService.updateAppointmentStatus(
          businessId,
          appointmentId,
          newStatus
        )

        if (res.success) {
          await loadAppointments()
          return { success: true }
        } else {
          return { success: false, error: res.error }
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Error al actualizar el turno' }
      } finally {
        setIsUpdatingStatus(null)
      }
    },
    [businessId, loadAppointments]
  )

  // 6. Cancel appointment (instantly frees up slot in PostgreSQL)
  const cancelAppointment = useCallback(
    async (appointmentId: string, reason?: string) => {
      if (!businessId) return { success: false, error: 'Sin negocio activo' }
      setIsUpdatingStatus(appointmentId)

      try {
        const res = await appointmentService.cancelAppointment(
          businessId,
          appointmentId,
          reason
        )

        if (res.success) {
          await loadAppointments()
          return { success: true }
        } else {
          return { success: false, error: res.error }
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Error al cancelar el turno' }
      } finally {
        setIsUpdatingStatus(null)
      }
    },
    [businessId, loadAppointments]
  )

  return {
    appointments,
    events,
    resources,
    staffList,
    selectedStaffId,
    setSelectedStaffId,
    dateRange,
    setDateRange,
    isLoading,
    errorMessage,
    isUpdatingStatus,
    updateAppointmentStatus,
    cancelAppointment,
    refetch: loadAppointments,
  }
}
