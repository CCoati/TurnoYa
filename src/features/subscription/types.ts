/**
 * SaaS Subscription & Plan Types
 * 
 * Domain architecture for multi-tier SaaS monetization:
 * - plans
 * - subscriptions
 * - business_limits
 * - usage
 */

export type PlanTier = 'free' | 'pro' | 'business' | string

export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'paused'

export type BillingCycle = 'free' | 'monthly' | 'yearly' | 'lifetime'

export type FeatureKey =
  | 'custom_branding'
  | 'whatsapp_integration'
  | 'whatsapp_api_automated'
  | 'advanced_analytics'
  | 'export_reports'
  | 'multi_branch'
  | 'priority_support'
  | 'api_access'
  | string

export interface PlanLimits {
  max_staff: number                 // -1 means unlimited
  max_monthly_appointments: number  // -1 means unlimited
  max_branches: number              // -1 means unlimited
  max_storage_mb: number            // Storage quota in MB
}

export interface Plan {
  id: PlanTier
  name: string
  description?: string
  price_monthly: number
  price_yearly: number
  currency: string
  is_active?: boolean
  sort_order?: number
  default_limits: PlanLimits
  features: Record<FeatureKey, boolean>
  created_at?: string
  updated_at?: string
}

export interface Subscription {
  id: string
  business_id: string
  plan_id: PlanTier
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string | null
  trial_start?: string | null
  trial_end?: string | null
  external_customer_id?: string | null     // Stripe customer id
  external_subscription_id?: string | null // Stripe subscription id
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface BusinessLimits {
  id?: string
  business_id?: string
  max_staff: number
  max_monthly_appointments: number
  max_branches: number
  max_storage_mb: number
  features: Record<FeatureKey, boolean>
}

export interface BusinessUsageSummary {
  current_staff: number
  current_monthly_appointments: number
  current_storage_mb?: number
  period_start: string
  period_end: string
}

export interface BusinessPlanOverview {
  plan: Plan
  subscription: Subscription
  limits: BusinessLimits
  usage: BusinessUsageSummary
  checks: {
    can_add_staff: boolean
    can_create_appointment: boolean
  }
}

export interface LimitCheckResult {
  allowed: boolean
  current: number
  max: number
  isUnlimited: boolean
  remaining: number
  percentage: number
  reason?: string
}
