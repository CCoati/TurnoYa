import {
  Business,
  BusinessSettings,
  BusinessHour,
  CreateBusinessDTO,
  UpdateBusinessDTO,
  UpdateBusinessSettingsDTO,
} from '@/features/businesses/types'
import { DbBusinessMember, BusinessRole } from '@/types/database.types'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase'

/**
 * Business & Tenant Service
 * Encapsulates multi-tenant business data, configurations, operating hours and staff memberships.
 */
export interface IBusinessService {
  getBusinessById(businessId: string): Promise<ApiResponse<Business>>
  getBusinessBySlug(slug: string): Promise<ApiResponse<Business>>
  createBusiness(data: CreateBusinessDTO, ownerUserId: string): Promise<ApiResponse<Business>>
  updateBusiness(businessId: string, data: UpdateBusinessDTO): Promise<ApiResponse<Business>>
  getBusinessSettings(businessId: string): Promise<ApiResponse<BusinessSettings>>
  updateBusinessSettings(businessId: string, data: UpdateBusinessSettingsDTO): Promise<ApiResponse<BusinessSettings>>
  getBusinessHours(businessId: string, branchId?: string): Promise<ApiResponse<BusinessHour[]>>
  updateBusinessHours(businessId: string, hours: BusinessHour[]): Promise<ApiResponse<BusinessHour[]>>
  getBusinessMembers(businessId: string): Promise<ApiResponse<DbBusinessMember[]>>
  addMemberToBusiness(businessId: string, userId: string, role: BusinessRole): Promise<ApiResponse<DbBusinessMember>>
}

class BusinessService implements IBusinessService {
  async getBusinessById(businessId: string): Promise<ApiResponse<Business>> {
    if (!businessId) {
      return { data: null, error: 'Business ID is required for tenant isolation', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const business: Business = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        category: data.category,
        description: data.description,
        logo_url: data.logo_url,
        phone: data.phone,
        email: data.email,
        address: data.address,
        active: Boolean(data.active),
        is_active: Boolean(data.active),
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return { data: business, error: null, success: true }
    } catch (err: any) {
      return { data: null, error: err.message, success: false }
    }
  }

  async getBusinessBySlug(slug: string): Promise<ApiResponse<Business>> {
    if (!slug) {
      return { data: null, error: 'Slug is required', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single()

      if (error) {
        return { data: null, error: `Negocio con slug '${slug}' no encontrado.`, success: false }
      }

      const business: Business = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        category: data.category,
        description: data.description,
        logo_url: data.logo_url,
        phone: data.phone,
        email: data.email,
        address: data.address,
        active: Boolean(data.active),
        is_active: Boolean(data.active),
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return { data: business, error: null, success: true }
    } catch (err: any) {
      return { data: null, error: err.message || 'Error al buscar el negocio.', success: false }
    }
  }

  async createBusiness(data: CreateBusinessDTO, _ownerUserId: string): Promise<ApiResponse<Business>> {
    const newBusiness: Business = {
      id: `biz_${Date.now()}`,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description || null,
      logo_url: null,
      banner_url: null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
      timezone: data.timezone || 'America/Argentina/Buenos_Aires',
      currency: data.currency || 'ARS',
      active: true,
      is_active: true,
      subscription_tier: 'starter',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // When Supabase is connected:
    // 1. Insert into businesses
    // 2. Insert into business_members with user_id = ownerUserId, role = 'owner'
    // 3. Insert default business_settings
    // 4. Insert default business_hours

    return {
      data: newBusiness,
      error: null,
      success: true,
    }
  }

  async updateBusiness(businessId: string, data: UpdateBusinessDTO): Promise<ApiResponse<Business>> {
    const existing = await this.getBusinessById(businessId)
    if (!existing.data) return existing

    const updated: Business = {
      ...existing.data,
      ...data,
      updated_at: new Date().toISOString(),
    }

    return { data: updated, error: null, success: true }
  }

  async getBusinessSettings(businessId: string): Promise<ApiResponse<BusinessSettings>> {
    return {
      data: {
        id: `set_${businessId}`,
        business_id: businessId,
        slot_interval_minutes: 30,
        min_booking_notice_hours: 2,
        max_booking_advance_days: 30,
        allow_client_cancellation: true,
        cancellation_deadline_hours: 4,
        require_phone: true,
        allow_staff_selection: true,
        auto_confirm_appointments: true,
        branch_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
      success: true,
    }
  }

  async updateBusinessSettings(
    businessId: string,
    data: UpdateBusinessSettingsDTO
  ): Promise<ApiResponse<BusinessSettings>> {
    const existing = await this.getBusinessSettings(businessId)
    if (!existing.data) return existing

    return {
      data: {
        ...existing.data,
        ...data,
        updated_at: new Date().toISOString(),
      },
      error: null,
      success: true,
    }
  }

  async getBusinessHours(businessId: string): Promise<ApiResponse<BusinessHour[]>> {
    if (!businessId) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', businessId)
        .order('day_of_week', { ascending: true })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      // Ensure all 7 days (0 to 6) are present
      const existingDays = new Set((data || []).map((d: any) => d.day_of_week))
      const fullHours: BusinessHour[] = (data || []).map((item: any) => ({
        id: item.id,
        business_id: item.business_id,
        day_of_week: Number(item.day_of_week),
        is_open: Boolean(item.is_open),
        open_time: item.open_time,
        close_time: item.close_time,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      for (let d = 0; d <= 6; d++) {
        if (!existingDays.has(d)) {
          fullHours.push({
            id: `temp_${businessId}_${d}`,
            business_id: businessId,
            day_of_week: d,
            is_open: d !== 0, // Domingo cerrado por defecto
            open_time: d !== 0 ? '09:00:00' : null,
            close_time: d !== 0 ? '20:00:00' : null,
          })
        }
      }

      fullHours.sort((a, b) => a.day_of_week - b.day_of_week)
      return { data: fullHours, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener los horarios de atención.',
        success: false,
      }
    }
  }

  async updateBusinessHours(businessId: string, hours: BusinessHour[]): Promise<ApiResponse<BusinessHour[]>> {
    if (!businessId) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }

    // Validation: open_time < close_time for open days
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    for (const h of hours) {
      if (h.is_open) {
        if (!h.open_time || !h.close_time) {
          return {
            data: null,
            error: `El día ${dayNames[h.day_of_week] || h.day_of_week} está marcado como abierto pero no tiene horario de apertura o cierre definido.`,
            success: false,
          }
        }
        if (h.open_time >= h.close_time) {
          return {
            data: null,
            error: `En ${dayNames[h.day_of_week] || h.day_of_week}, la hora de apertura (${h.open_time}) debe ser anterior a la hora de cierre (${h.close_time}).`,
            success: false,
          }
        }
      }
    }

    try {
      const payload = hours.map((h) => ({
        business_id: businessId,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        open_time: h.is_open ? h.open_time : null,
        close_time: h.is_open ? h.close_time : null,
      }))

      const { data, error } = await supabase
        .from('business_hours')
        .upsert(payload, { onConflict: 'business_id, day_of_week' })
        .select('*')
        .order('day_of_week', { ascending: true })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const updatedHours: BusinessHour[] = (data || []).map((item: any) => ({
        id: item.id,
        business_id: item.business_id,
        day_of_week: Number(item.day_of_week),
        is_open: Boolean(item.is_open),
        open_time: item.open_time,
        close_time: item.close_time,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      return { data: updatedHours, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al guardar los horarios de atención.',
        success: false,
      }
    }
  }

  async getBusinessMembers(businessId: string): Promise<ApiResponse<DbBusinessMember[]>> {
    return {
      data: [
        {
          id: 'mem_01',
          business_id: businessId,
          user_id: 'usr_01a',
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      error: null,
      success: true,
    }
  }

  async addMemberToBusiness(
    businessId: string,
    userId: string,
    role: BusinessRole
  ): Promise<ApiResponse<DbBusinessMember>> {
    return {
      data: {
        id: `mem_${Date.now()}`,
        business_id: businessId,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
      success: true,
    }
  }
}

export const businessService = new BusinessService()
