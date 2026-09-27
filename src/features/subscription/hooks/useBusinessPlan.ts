import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBusiness } from '@/features/businesses/BusinessContext'
import { subscriptionService } from '@/services/subscriptionService'
import {
  BusinessPlanOverview,
  FeatureKey,
  PlanTier,
  LimitCheckResult,
} from '../types'
import {
  canAddStaff as checkCanAddStaff,
  canCreateAppointment as checkCanCreateAppointment,
  canUseFeature as checkCanUseFeature,
  getStaffLimitDetails,
  getAppointmentLimitDetails,
} from '../utils/planGuards'

export function useBusinessPlan(targetBusinessId?: string) {
  const { activeBusiness } = useBusiness()
  const businessId = targetBusinessId || activeBusiness?.id

  const [overview, setOverview] = useState<BusinessPlanOverview | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    if (!businessId) {
      setOverview(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await subscriptionService.getBusinessPlanAndLimits(businessId)
      if (res.success && res.data) {
        setOverview(res.data)
      } else {
        setError(res.error || 'No se pudo cargar la información del plan.')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al cargar el plan.')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  // Reusable boolean limit & feature checkers (zero hardcoding)
  const canAddStaff = useMemo(() => checkCanAddStaff(overview), [overview])
  const canCreateAppointment = useMemo(() => checkCanCreateAppointment(overview), [overview])

  const canUseFeature = useCallback(
    (feature: FeatureKey): boolean => {
      return checkCanUseFeature(feature, overview)
    },
    [overview]
  )

  const staffCheck: LimitCheckResult = useMemo(
    () => getStaffLimitDetails(overview),
    [overview]
  )

  const appointmentCheck: LimitCheckResult = useMemo(
    () => getAppointmentLimitDetails(overview),
    [overview]
  )

  const changePlan = async (newPlanId: PlanTier): Promise<boolean> => {
    if (!businessId) return false
    setIsLoading(true)
    try {
      const res = await subscriptionService.changeBusinessPlan(businessId, newPlanId)
      if (res.success) {
        await fetchOverview()
        return true
      } else {
        setError(res.error || 'No se pudo cambiar el plan.')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el plan.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    overview,
    plan: overview?.plan || null,
    subscription: overview?.subscription || null,
    limits: overview?.limits || null,
    usage: overview?.usage || null,
    isLoading,
    error,
    // Reusable check functions required by user
    canAddStaff,
    canCreateAppointment,
    canUseFeature,
    staffCheck,
    appointmentCheck,
    changePlan,
    refresh: fetchOverview,
  }
}
