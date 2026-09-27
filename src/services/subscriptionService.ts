import { supabase } from '@/lib/supabase'
import { ApiResponse } from '@/types'
import {
  Plan,
  BusinessPlanOverview,
  FeatureKey,
  PlanTier,
} from '@/features/subscription/types'

export class SubscriptionService {
  /**
   * Retrieves complete overview of a business's current plan, subscription,
   * effective limits, real-time usage, and boolean check flags from the backend.
   */
  async getBusinessPlanAndLimits(businessId: string): Promise<ApiResponse<BusinessPlanOverview>> {
    try {
      const { data, error } = await supabase.rpc('get_business_plan_and_limits', {
        p_business_id: businessId,
      })

      if (error) {
        console.error('Error fetching business plan and limits:', error)
        return { success: false, data: null, error: error.message }
      }

      if (!data) {
        return { success: false, data: null, error: 'No se encontraron datos de suscripción para el negocio.' }
      }

      return {
        success: true,
        data: data as unknown as BusinessPlanOverview,
        error: null,
      }
    } catch (err: any) {
      console.error('Unexpected error fetching business plan:', err)
      return { success: false, data: null, error: err.message || 'Error inesperado.' }
    }
  }

  /**
   * Fetches all active plans available in the catalog.
   */
  async getAllPlans(): Promise<ApiResponse<Plan[]>> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching plans:', error)
        return { success: false, data: null, error: error.message }
      }

      return {
        success: true,
        data: (data || []) as unknown as Plan[],
        error: null,
      }
    } catch (err: any) {
      console.error('Unexpected error fetching plans:', err)
      return { success: false, data: null, error: err.message || 'Error inesperado.' }
    }
  }

  /**
   * Reusable backend check: Can the business add another staff member?
   */
  async canAddStaff(businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_add_staff', {
        p_business_id: businessId,
      })
      if (error) {
        console.error('Error checking can_add_staff:', error)
        return false
      }
      return Boolean(data)
    } catch (err) {
      console.error('Unexpected error checking can_add_staff:', err)
      return false
    }
  }

  /**
   * Reusable backend check: Can the business accept/create another appointment this month?
   */
  async canCreateAppointment(businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_create_appointment', {
        p_business_id: businessId,
      })
      if (error) {
        console.error('Error checking can_create_appointment:', error)
        return false
      }
      return Boolean(data)
    } catch (err) {
      console.error('Unexpected error checking can_create_appointment:', err)
      return false
    }
  }

  /**
   * Reusable backend check: Does the business have access to a specific feature?
   */
  async canUseFeature(businessId: string, featureKey: FeatureKey): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_use_feature', {
        p_business_id: businessId,
        p_feature_key: featureKey,
      })
      if (error) {
        console.error('Error checking can_use_feature:', error)
        return false
      }
      return Boolean(data)
    } catch (err) {
      console.error('Unexpected error checking can_use_feature:', err)
      return false
    }
  }

  /**
   * Changes the plan for a business (Pre-billing mock/admin activation).
   * Updates subscription and updates business_limits according to new plan.
   */
  async changeBusinessPlan(businessId: string, planId: PlanTier): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('change_business_plan', {
        p_business_id: businessId,
        p_plan_id: planId,
      })

      if (error) {
        console.error('Error changing business plan:', error)
        return { success: false, data: null, error: error.message }
      }

      return { success: true, data: null, error: null }
    } catch (err: any) {
      console.error('Unexpected error changing plan:', err)
      return { success: false, data: null, error: err.message || 'Error inesperado al cambiar de plan.' }
    }
  }
}

export const subscriptionService = new SubscriptionService()
