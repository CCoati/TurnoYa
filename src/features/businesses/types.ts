import {
  DbBusiness,
  DbBusinessSettings,
  DbBusinessHour,
  BusinessCategory,
  SubscriptionTier,
} from '@/types/database.types'

export type { BusinessCategory, SubscriptionTier }

export interface Business extends DbBusiness {
  is_active?: boolean
  category: BusinessCategory
  city?: string | null
  country?: string | null
  subscription_tier?: SubscriptionTier
  banner_url?: string | null
  timezone?: string
  currency?: string
}

export interface BusinessSettings extends Partial<DbBusinessSettings> {
  id: string
  business_id: string
  timezone?: string
  currency?: string
  booking_enabled?: boolean
  created_at?: string
  updated_at?: string
  slot_interval_minutes?: number
  min_booking_notice_hours?: number
  max_booking_advance_days?: number
  allow_client_cancellation?: boolean
  cancellation_deadline_hours?: number
  require_phone?: boolean
  allow_staff_selection?: boolean
  auto_confirm_appointments?: boolean
  branch_enabled?: boolean
}

export interface BusinessHour extends Partial<DbBusinessHour> {
  id: string
  business_id: string
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
  created_at?: string
  updated_at?: string
  break_start_time?: string | null
  break_end_time?: string | null
  branch_id?: string | null
}

/**
 * Architectural Extension: Special Dates & Overrides
 * Prepared for upcoming: holidays, vacations, special dates & customized hours.
 */
export type ScheduleOverrideType =
  | 'holiday'          // Feriado nacional o local
  | 'vacation'         // Período de vacaciones del negocio
  | 'special_hours'    // Horario especial extendido o reducido (ej. vísperas de fiesta)
  | 'custom_closure'   // Cierre extraordinario por remodelación o evento

export interface BusinessScheduleOverride {
  id: string
  business_id: string
  date: string // ISO 'YYYY-MM-DD'
  override_type: ScheduleOverrideType
  is_closed: boolean
  open_time?: string | null
  close_time?: string | null
  title: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface DayOfWeekMeta {
  day: number
  name: string
  short: string
}

export const DAYS_OF_WEEK_ORDERED: DayOfWeekMeta[] = [
  { day: 1, name: 'Lunes', short: 'Lun' },
  { day: 2, name: 'Martes', short: 'Mar' },
  { day: 3, name: 'Miércoles', short: 'Mié' },
  { day: 4, name: 'Jueves', short: 'Jue' },
  { day: 5, name: 'Viernes', short: 'Vie' },
  { day: 6, name: 'Sábado', short: 'Sáb' },
  { day: 0, name: 'Domingo', short: 'Dom' },
]

export interface CreateBusinessDTO {
  name: string
  slug: string
  category: BusinessCategory
  description?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  timezone?: string
  currency?: string
}

export interface UpdateBusinessDTO extends Partial<CreateBusinessDTO> {
  isActive?: boolean
  logoUrl?: string
  bannerUrl?: string
}

export interface UpdateBusinessSettingsDTO extends Partial<Omit<DbBusinessSettings, 'id' | 'business_id' | 'created_at' | 'updated_at'>> {}
