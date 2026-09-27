import { supabase } from '@/lib/supabase'
import {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
} from '@/features/services/types'
import { ApiResponse } from '@/types'

/**
 * Service & Catalog Management Service
 * Strictly scoped by business_id to enforce multi-tenant isolation alongside PostgreSQL RLS.
 */
export interface IServiceService {
  getServices(businessId: string): Promise<ApiResponse<Service[]>>
  getServiceById(businessId: string, serviceId: string): Promise<ApiResponse<Service>>
  createService(data: CreateServiceInput): Promise<ApiResponse<Service>>
  updateService(businessId: string, serviceId: string, data: UpdateServiceInput): Promise<ApiResponse<Service>>
  toggleServiceActive(businessId: string, serviceId: string, active: boolean): Promise<ApiResponse<Service>>
  checkAppointmentsCount(businessId: string, serviceId: string): Promise<ApiResponse<number>>
  deleteService(businessId: string, serviceId: string, softDeleteIfAppointments?: boolean): Promise<ApiResponse<{ softDeleted: boolean }>>
}

class ServiceService implements IServiceService {
  /**
   * List all services for a specific business.
   * Supabase RLS enforces that auth.uid() belongs to this business.
   */
  async getServices(businessId: string): Promise<ApiResponse<Service[]>> {
    if (!businessId) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const services: Service[] = (data || []).map((item) => ({
        id: item.id,
        business_id: item.business_id,
        name: item.name,
        description: item.description,
        duration_minutes: Number(item.duration_minutes),
        price: Number(item.price),
        active: Boolean(item.active),
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      return { data: services, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener el catálogo de servicios.',
        success: false,
      }
    }
  }

  /**
   * Get single service by ID.
   */
  async getServiceById(businessId: string, serviceId: string): Promise<ApiResponse<Service>> {
    if (!businessId || !serviceId) {
      return { data: null, error: 'ID de negocio y de servicio requeridos.', success: false }
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('id', serviceId)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const service: Service = {
        id: data.id,
        business_id: data.business_id,
        name: data.name,
        description: data.description,
        duration_minutes: Number(data.duration_minutes),
        price: Number(data.price),
        active: Boolean(data.active),
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      return { data: service, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al obtener el servicio.',
        success: false,
      }
    }
  }

  /**
   * Create a new service.
   * RLS requires the caller to be an 'owner' or 'admin' of the business.
   */
  async createService(data: CreateServiceInput): Promise<ApiResponse<Service>> {
    if (!data.business_id) {
      return { data: null, error: 'Se requiere el ID del negocio.', success: false }
    }
    if (!data.name || !data.name.trim()) {
      return { data: null, error: 'El nombre del servicio es obligatorio.', success: false }
    }
    if (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0) {
      return { data: null, error: 'La duración debe ser un número mayor a 0 minutos.', success: false }
    }
    if (typeof data.price !== 'number' || data.price < 0) {
      return { data: null, error: 'El precio debe ser un número igual o mayor a 0.', success: false }
    }

    try {
      const { data: created, error } = await supabase
        .from('services')
        .insert({
          business_id: data.business_id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          duration_minutes: Math.round(data.duration_minutes),
          price: data.price,
          active: data.active ?? true,
        })
        .select('*')
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const service: Service = {
        id: created.id,
        business_id: created.business_id,
        name: created.name,
        description: created.description,
        duration_minutes: Number(created.duration_minutes),
        price: Number(created.price),
        active: Boolean(created.active),
        created_at: created.created_at,
        updated_at: created.updated_at,
      }

      return { data: service, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error inesperado al crear el servicio.',
        success: false,
      }
    }
  }

  /**
   * Update an existing service (price, duration, name, description, active).
   */
  async updateService(
    businessId: string,
    serviceId: string,
    data: UpdateServiceInput
  ): Promise<ApiResponse<Service>> {
    if (!businessId || !serviceId) {
      return { data: null, error: 'ID de negocio y de servicio requeridos.', success: false }
    }

    try {
      const updatePayload: Record<string, any> = {}
      if (data.name !== undefined) {
        if (!data.name.trim()) {
          return { data: null, error: 'El nombre del servicio no puede estar vacío.', success: false }
        }
        updatePayload.name = data.name.trim()
      }
      if (data.description !== undefined) {
        updatePayload.description = data.description?.trim() || null
      }
      if (data.duration_minutes !== undefined) {
        if (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0) {
          return { data: null, error: 'La duración debe ser un número mayor a 0 minutos.', success: false }
        }
        updatePayload.duration_minutes = Math.round(data.duration_minutes)
      }
      if (data.price !== undefined) {
        if (typeof data.price !== 'number' || data.price < 0) {
          return { data: null, error: 'El precio debe ser un número igual o mayor a 0.', success: false }
        }
        updatePayload.price = data.price
      }
      if (data.active !== undefined) {
        updatePayload.active = Boolean(data.active)
      }

      const { data: updated, error } = await supabase
        .from('services')
        .update(updatePayload)
        .eq('business_id', businessId)
        .eq('id', serviceId)
        .select('*')
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      const service: Service = {
        id: updated.id,
        business_id: updated.business_id,
        name: updated.name,
        description: updated.description,
        duration_minutes: Number(updated.duration_minutes),
        price: Number(updated.price),
        active: Boolean(updated.active),
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      }

      return { data: service, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error inesperado al actualizar el servicio.',
        success: false,
      }
    }
  }

  /**
   * Fast toggle active / inactive status (Soft activate/deactivate).
   */
  async toggleServiceActive(
    businessId: string,
    serviceId: string,
    active: boolean
  ): Promise<ApiResponse<Service>> {
    return this.updateService(businessId, serviceId, { active })
  }

  /**
   * Check how many appointments are linked to this service in this business.
   */
  async checkAppointmentsCount(businessId: string, serviceId: string): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('service_id', serviceId)

      if (error) {
        return { data: 0, error: error.message, success: false }
      }

      return { data: count || 0, error: null, success: true }
    } catch {
      return { data: 0, error: null, success: true }
    }
  }

  /**
   * Delete service safely:
   * 1. Check if historical appointments exist.
   * 2. If appointments exist:
   *    - Physical deletion will be blocked by PostgreSQL FK RESTRICT.
   *    - Execute soft delete (active = false) instead to protect history.
   * 3. If no appointments exist:
   *    - Safely delete row physically.
   */
  async deleteService(
    businessId: string,
    serviceId: string,
    softDeleteIfAppointments: boolean = true
  ): Promise<ApiResponse<{ softDeleted: boolean }>> {
    if (!businessId || !serviceId) {
      return { data: null, error: 'ID de negocio y servicio requeridos.', success: false }
    }

    try {
      // 1. Check appointments count
      const checkRes = await this.checkAppointmentsCount(businessId, serviceId)
      const appointmentsCount = checkRes.data || 0

      if (appointmentsCount > 0) {
        if (softDeleteIfAppointments) {
          // Perform soft delete
          const softRes = await this.toggleServiceActive(businessId, serviceId, false)
          if (!softRes.success) {
            return { data: null, error: softRes.error, success: false }
          }
          return { data: { softDeleted: true }, error: null, success: true }
        } else {
          return {
            data: null,
            error: `Este servicio tiene ${appointmentsCount} turnos registrados. No se puede eliminar físicamente para conservar el historial contable y de clientes. Se recomienda desactivarlo.`,
            success: false,
          }
        }
      }

      // 2. No appointments found, attempt hard delete
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('business_id', businessId)
        .eq('id', serviceId)

      if (error) {
        // If Postgres FK constraint still catches an uncounted appointment:
        if (error.code === '23503') {
          // Fall back to soft delete
          await this.toggleServiceActive(businessId, serviceId, false)
          return { data: { softDeleted: true }, error: null, success: true }
        }
        return { data: null, error: error.message, success: false }
      }

      return { data: { softDeleted: false }, error: null, success: true }
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Error al procesar la eliminación del servicio.',
        success: false,
      }
    }
  }
}

export const serviceService = new ServiceService()
