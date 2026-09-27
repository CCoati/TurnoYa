import { BusinessPlanOverview, FeatureKey, LimitCheckResult } from '../types'

/**
 * Pure reusable guard functions to check SaaS business limits and feature entitlements.
 * These work with the dynamic overview supplied by the backend.
 * NO LIMITS ARE HARDCODED.
 */

/**
 * Checks if the business can add another staff member based on backend-configured limits.
 */
export function canAddStaff(overview?: BusinessPlanOverview | null): boolean {
  if (!overview) return true // Allow graceful degraded operation if offline
  if (overview.checks?.can_add_staff !== undefined) {
    return overview.checks.can_add_staff
  }
  const max = overview.limits.max_staff
  if (max === -1) return true
  return overview.usage.current_staff < max
}

/**
 * Checks if the business can create another appointment this month.
 */
export function canCreateAppointment(overview?: BusinessPlanOverview | null): boolean {
  if (!overview) return true
  if (overview.checks?.can_create_appointment !== undefined) {
    return overview.checks.can_create_appointment
  }
  const max = overview.limits.max_monthly_appointments
  if (max === -1) return true
  return overview.usage.current_monthly_appointments < max
}

/**
 * Checks if the business plan or limits enable a specific feature.
 */
export function canUseFeature(feature: FeatureKey, overview?: BusinessPlanOverview | null): boolean {
  if (!overview) return false
  return Boolean(overview.limits.features?.[feature])
}

/**
 * Diagnostic helper: Returns detailed breakdown of staff quota usage.
 */
export function getStaffLimitDetails(overview?: BusinessPlanOverview | null): LimitCheckResult {
  if (!overview) {
    return {
      allowed: true,
      current: 0,
      max: -1,
      isUnlimited: true,
      remaining: 999,
      percentage: 0,
    }
  }

  const current = overview.usage.current_staff
  const max = overview.limits.max_staff
  const isUnlimited = max === -1
  const allowed = isUnlimited || current < max
  const remaining = isUnlimited ? Infinity : Math.max(0, max - current)
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100))

  return {
    allowed,
    current,
    max,
    isUnlimited,
    remaining,
    percentage,
    reason: allowed
      ? undefined
      : `Has alcanzado el límite de tu plan (${current}/${max} barberos). Actualiza tu plan para agregar más.`,
  }
}

/**
 * Diagnostic helper: Returns detailed breakdown of monthly appointment quota.
 */
export function getAppointmentLimitDetails(overview?: BusinessPlanOverview | null): LimitCheckResult {
  if (!overview) {
    return {
      allowed: true,
      current: 0,
      max: -1,
      isUnlimited: true,
      remaining: 999,
      percentage: 0,
    }
  }

  const current = overview.usage.current_monthly_appointments
  const max = overview.limits.max_monthly_appointments
  const isUnlimited = max === -1
  const allowed = isUnlimited || current < max
  const remaining = isUnlimited ? Infinity : Math.max(0, max - current)
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100))

  return {
    allowed,
    current,
    max,
    isUnlimited,
    remaining,
    percentage,
    reason: allowed
      ? undefined
      : `Has alcanzado el límite mensual de reservas (${current}/${max}). Actualiza tu plan para seguir recibiendo turnos.`,
  }
}
