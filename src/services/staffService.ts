import { supabase } from '@/lib/supabase'
import {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
  BusinessMemberOption,
} from '@/features/staff/types'
import { ApiResponse } from '@/types'

/**
 * Staff & Barber Management Service
 * Strictly scoped by business_id to enforce multi-tenant isolation alongside PostgreSQL RLS.
 */
export interface IStaffService {
  getStaff(businessId: string): Promise<ApiResponse<Staff[]>>
  getStaffById(businessId: string, staffId: string): Promise<ApiResponse<Staff>>
  createStaff(data: CreateStaffInput): Promise<ApiResponse<Staff>>
  updateStaff(businessId: string, staffId: string, data: UpdateStaffInput): Promise<ApiResponse<Staff>>
  toggleStaffActive(businessId: string, staffId: string, active: boolean): Promise<ApiResponse<Staff>>
  deleteStaff(businessId: string, staffId: string): Promise<ApiResponse<void>>
  getEligibleMembersForLinking(businessId: string): Promise<ApiResponse<BusinessMemberOption[]>>
}

class StaffService implements IStaffService {
  /**
   * List all staff members for a specific business.
   * Supabase RLS enforces that auth.uid() must belong to the business.
   */
  async getStaff(businessId: string): Promise<ApiResponse<Staff[]>> {
    if (!businessId) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          business_id,
          user_id,
          name,
          phone,
          avatar_url,
          active,
          created_at,
          updated_at,
          profile:profiles(id, full_name, avatar_url, phone)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      // Format data properly
      const staffList: Staff[] = (data || []).map((item: any) => ({
        id: item.id,
        business_id: item.business_id,
        user_id: item.user_id,
        name: item.name,
        phone: item.phone,
        avatar_url: item.avatar_url,
        active: item.active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        profile: item.profile || null,
      }))

      return { data: staffList, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener el equipo de profesionales.',
        success: false,
      }
    }
  }

  /**
   * Get single staff member by ID.
   */
  async getStaffById(businessId: string, staffId: string): Promise<ApiResponse<Staff>> {
    if (!businessId || !staffId) {
      return { data: null, error: 'ID de negocio y de profesional requeridos.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          business_id,
          user_id,
          name,
          phone,
          avatar_url,
          active,
          created_at,
          updated_at,
          profile:profiles(id, full_name, avatar_url, phone)
        `)
        .eq('business_id', businessId)
        .eq('id', staffId)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const staff: Staff = {
        id: data.id,
        business_id: data.business_id,
        user_id: data.user_id,
        name: data.name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        active: data.active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        profile: (data as any).profile || null,
      }

      return { data: staff, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener información del profesional.',
        success: false,
      }
    }
  }

  /**
   * Create a new staff member / barber.
   * RLS requires the caller to be an 'owner' or 'admin' of the business.
   */
  async createStaff(data: CreateStaffInput): Promise<ApiResponse<Staff>> {
    if (!data.business_id) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }
    if (!data.name || !data.name.trim()) {
      return { data: null, error: 'El nombre del profesional es obligatorio.', success: false }
    }

    try {
      const { data: created, error } = await supabase
        .from('staff')
        .insert({
          business_id: data.business_id,
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          avatar_url: data.avatar_url?.trim() || null,
          active: data.active ?? true,
          user_id: data.user_id || null,
        })
        .select(`
          id,
          business_id,
          user_id,
          name,
          phone,
          avatar_url,
          active,
          created_at,
          updated_at,
          profile:profiles(id, full_name, avatar_url, phone)
        `)
        .single()

      if (error) {
        if (error.code === '23505') {
          return {
            data: null,
            error: 'Este usuario ya está registrado como colaborador en este negocio.',
            success: false,
          }
        }
        return { data: null, error: error.message, success: false }
      }

      const staff: Staff = {
        id: created.id,
        business_id: created.business_id,
        user_id: created.user_id,
        name: created.name,
        phone: created.phone,
        avatar_url: created.avatar_url,
        active: created.active,
        created_at: created.created_at,
        updated_at: created.updated_at,
        profile: (created as any).profile || null,
      }

      return { data: staff, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error inesperado al crear el profesional.',
        success: false,
      }
    }
  }

  /**
   * Update an existing staff member.
   */
  async updateStaff(
    businessId: string,
    staffId: string,
    data: UpdateStaffInput
  ): Promise<ApiResponse<Staff>> {
    if (!businessId || !staffId) {
      return { data: null, error: 'ID de negocio y de profesional requeridos.', success: false }
    }

    try {
      const updatePayload: Record<string, any> = {}
      if (data.name !== undefined) updatePayload.name = data.name.trim()
      if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null
      if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url?.trim() || null
      if (data.active !== undefined) updatePayload.active = data.active
      if (data.user_id !== undefined) updatePayload.user_id = data.user_id || null

      const { data: updated, error } = await supabase
        .from('staff')
        .update(updatePayload)
        .eq('business_id', businessId)
        .eq('id', staffId)
        .select(`
          id,
          business_id,
          user_id,
          name,
          phone,
          avatar_url,
          active,
          created_at,
          updated_at,
          profile:profiles(id, full_name, avatar_url, phone)
        `)
        .single()

      if (error) {
        if (error.code === '23505') {
          return {
            data: null,
            error: 'Este usuario ya está registrado como colaborador en este negocio.',
            success: false,
          }
        }
        return { data: null, error: error.message, success: false }
      }

      const staff: Staff = {
        id: updated.id,
        business_id: updated.business_id,
        user_id: updated.user_id,
        name: updated.name,
        phone: updated.phone,
        avatar_url: updated.avatar_url,
        active: updated.active,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        profile: (updated as any).profile || null,
      }

      return { data: staff, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error inesperado al actualizar el profesional.',
        success: false,
      }
    }
  }

  /**
   * Fast toggle active / inactive status.
   */
  async toggleStaffActive(
    businessId: string,
    staffId: string,
    active: boolean
  ): Promise<ApiResponse<Staff>> {
    return this.updateStaff(businessId, staffId, { active })
  }

  /**
   * Delete a staff member.
   * RLS requires the caller to be an 'owner' or 'admin'.
   */
  async deleteStaff(businessId: string, staffId: string): Promise<ApiResponse<void>> {
    if (!businessId || !staffId) {
      return { data: null, error: 'ID de negocio y de profesional requeridos.', success: false }
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('business_id', businessId)
        .eq('id', staffId)

      if (error) {
        // Check for foreign key restriction (e.g. if appointments exist)
        if (error.code === '23503') {
          return {
            data: null,
            error: 'No se puede eliminar el profesional porque tiene turnos asociados. Puedes desactivarlo para que no reciba nuevas reservas.',
            success: false,
          }
        }
        return { data: null, error: error.message, success: false }
      }

      return { data: undefined, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al eliminar el colaborador.',
        success: false,
      }
    }
  }

  /**
   * Get members of the current business so the owner can link a staff member
   * to an authenticated user profile in the business.
   */
  async getEligibleMembersForLinking(businessId: string): Promise<ApiResponse<BusinessMemberOption[]>> {
    if (!businessId) {
      return { data: [], error: null, success: true }
    }

    try {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          user_id,
          role,
          profile:profiles(id, full_name, avatar_url, phone)
        `)
        .eq('business_id', businessId)

      if (error) {
        return { data: [], error: error.message, success: false }
      }

      const options: BusinessMemberOption[] = (data || []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        full_name: m.profile?.full_name || 'Usuario',
        avatar_url: m.profile?.avatar_url || null,
        phone: m.profile?.phone || null,
      }))

      return { data: options, error: null, success: true }
    } catch {
      return { data: [], error: null, success: true }
    }
  }
}

export const staffService = new StaffService()
