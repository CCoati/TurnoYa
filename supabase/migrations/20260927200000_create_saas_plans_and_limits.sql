-- ==============================================================================
-- MIGRATION: SaaS Architecture - Plans, Subscriptions, Limits & Usage
-- ==============================================================================

-- 1. Tabla de Planes Comerciales
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY, -- 'free', 'pro', 'business'
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  default_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Suscripciones por Negocio
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'paused')),
  billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('free', 'monthly', 'yearly', 'lifetime')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '100 years'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  external_customer_id TEXT,      -- Preparado para Stripe cus_xxx
  external_subscription_id TEXT,  -- Preparado para Stripe sub_xxx
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subscriptions_business UNIQUE (business_id)
);

-- 3. Tabla de Límites Efectivos por Negocio
CREATE TABLE IF NOT EXISTS public.business_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  max_staff INTEGER NOT NULL DEFAULT 1,                -- -1 = ilimitado
  max_monthly_appointments INTEGER NOT NULL DEFAULT 50, -- -1 = ilimitado
  max_branches INTEGER NOT NULL DEFAULT 1,             -- -1 = ilimitado
  max_storage_mb INTEGER NOT NULL DEFAULT 100,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_business_limits_business UNIQUE (business_id)
);

-- 4. Tabla de Métricas de Uso
CREATE TABLE IF NOT EXISTS public.business_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  metric VARCHAR(64) NOT NULL, -- 'monthly_appointments', 'storage_mb', etc.
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_business_usage_metric_period UNIQUE (business_id, metric, period_start)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_business_limits_business ON public.business_limits(business_id);
CREATE INDEX IF NOT EXISTS idx_business_usage_lookup ON public.business_usage(business_id, metric, period_start);

-- 5. Semilla inicial de Planes (Free, Pro, Business)
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, currency, sort_order, default_limits, features)
VALUES 
(
  'free',
  'Free (Plan Inicial)',
  'Ideal para barberos independientes o negocios que están comenzando.',
  0.00,
  0.00,
  'USD',
  1,
  '{
    "max_staff": 1,
    "max_monthly_appointments": 50,
    "max_branches": 1,
    "max_storage_mb": 100
  }'::jsonb,
  '{
    "custom_branding": false,
    "whatsapp_integration": true,
    "whatsapp_api_automated": false,
    "advanced_analytics": false,
    "export_reports": false,
    "multi_branch": false,
    "priority_support": false
  }'::jsonb
),
(
  'pro',
  'Pro (Profesional)',
  'Para barberías y salones en crecimiento con equipo de profesionales.',
  29.00,
  290.00,
  'USD',
  2,
  '{
    "max_staff": 5,
    "max_monthly_appointments": 300,
    "max_branches": 1,
    "max_storage_mb": 500
  }'::jsonb,
  '{
    "custom_branding": true,
    "whatsapp_integration": true,
    "whatsapp_api_automated": true,
    "advanced_analytics": true,
    "export_reports": true,
    "multi_branch": false,
    "priority_support": true
  }'::jsonb
),
(
  'business',
  'Business (Empresas)',
  'Capacidad ilimitada, múltiples sucursales y soporte de alta prioridad.',
  79.00,
  790.00,
  'USD',
  3,
  '{
    "max_staff": -1,
    "max_monthly_appointments": -1,
    "max_branches": 5,
    "max_storage_mb": 2048
  }'::jsonb,
  '{
    "custom_branding": true,
    "whatsapp_integration": true,
    "whatsapp_api_automated": true,
    "advanced_analytics": true,
    "export_reports": true,
    "multi_branch": true,
    "priority_support": true,
    "api_access": true
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  default_limits = EXCLUDED.default_limits,
  features = EXCLUDED.features;

-- 6. Funciones reutilizables de verificación de límites en Backend

-- Comprueba si el negocio puede agregar otro barbero/staff
CREATE OR REPLACE FUNCTION public.can_add_staff(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max_staff INTEGER;
  v_current_staff INTEGER;
BEGIN
  -- Obtener límite configurado
  SELECT max_staff INTO v_max_staff
  FROM public.business_limits
  WHERE business_id = p_business_id;

  -- Fallback al plan Free si no existe límite configurado
  IF v_max_staff IS NULL THEN
    v_max_staff := 1;
  END IF;

  -- -1 significa ilimitado
  IF v_max_staff = -1 THEN
    RETURN true;
  END IF;

  -- Contar staff actual activo
  SELECT count(*) INTO v_current_staff
  FROM public.staff
  WHERE business_id = p_business_id
    AND active = true;

  RETURN v_current_staff < v_max_staff;
END;
$$;

-- Comprueba si el negocio puede crear otra reserva en el mes corriente
CREATE OR REPLACE FUNCTION public.can_create_appointment(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max_monthly INTEGER;
  v_current_monthly INTEGER;
  v_start_of_month DATE;
  v_end_of_month DATE;
BEGIN
  SELECT max_monthly_appointments INTO v_max_monthly
  FROM public.business_limits
  WHERE business_id = p_business_id;

  IF v_max_monthly IS NULL THEN
    v_max_monthly := 50;
  END IF;

  IF v_max_monthly = -1 THEN
    RETURN true;
  END IF;

  v_start_of_month := date_trunc('month', current_date)::DATE;
  v_end_of_month := (date_trunc('month', current_date) + interval '1 month - 1 day')::DATE;

  SELECT count(*) INTO v_current_monthly
  FROM public.appointments
  WHERE business_id = p_business_id
    AND appointment_date >= v_start_of_month
    AND appointment_date <= v_end_of_month
    AND status != 'cancelled';

  RETURN v_current_monthly < v_max_monthly;
END;
$$;

-- Comprueba si el negocio tiene habilitada una feature específica
CREATE OR REPLACE FUNCTION public.can_use_feature(p_business_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT features INTO v_features
  FROM public.business_limits
  WHERE business_id = p_business_id;

  IF v_features IS NULL THEN
    SELECT p.features INTO v_features
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id;
  END IF;

  IF v_features IS NULL THEN
    RETURN false;
  END IF;

  RETURN coalesce((v_features->>p_feature_key)::boolean, false);
END;
$$;

-- Función completa de diagnóstico de suscripción, límites y uso
CREATE OR REPLACE FUNCTION public.get_business_plan_and_limits(p_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan RECORD;
  v_sub RECORD;
  v_limits RECORD;
  v_current_staff INTEGER;
  v_current_appointments INTEGER;
  v_start_of_month DATE;
  v_end_of_month DATE;
  v_result JSONB;
BEGIN
  -- 1. Obtener o asignar suscripción
  SELECT s.*, p.name AS plan_name, p.description AS plan_description, 
         p.price_monthly, p.price_yearly, p.currency
  INTO v_sub
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.business_id = p_business_id;

  IF v_sub IS NULL THEN
    -- Crear suscripción Free automática si aún no tiene
    INSERT INTO public.subscriptions (business_id, plan_id, status, billing_cycle)
    VALUES (p_business_id, 'free', 'active', 'free')
    ON CONFLICT (business_id) DO NOTHING;

    SELECT s.*, p.name AS plan_name, p.description AS plan_description, 
           p.price_monthly, p.price_yearly, p.currency
    INTO v_sub
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id;
  END IF;

  -- 2. Obtener o asignar límites efectivos
  SELECT * INTO v_limits
  FROM public.business_limits
  WHERE business_id = p_business_id;

  IF v_limits IS NULL THEN
    INSERT INTO public.business_limits (
      business_id, 
      max_staff, 
      max_monthly_appointments, 
      max_branches, 
      max_storage_mb, 
      features
    )
    SELECT 
      p_business_id,
      (default_limits->>'max_staff')::INTEGER,
      (default_limits->>'max_monthly_appointments')::INTEGER,
      (default_limits->>'max_branches')::INTEGER,
      (default_limits->>'max_storage_mb')::INTEGER,
      features
    FROM public.plans
    WHERE id = coalesce(v_sub.plan_id, 'free')
    ON CONFLICT (business_id) DO NOTHING;

    SELECT * INTO v_limits
    FROM public.business_limits
    WHERE business_id = p_business_id;
  END IF;

  -- 3. Calcular métricas de uso reales
  SELECT count(*) INTO v_current_staff
  FROM public.staff
  WHERE business_id = p_business_id
    AND active = true;

  v_start_of_month := date_trunc('month', current_date)::DATE;
  v_end_of_month := (date_trunc('month', current_date) + interval '1 month - 1 day')::DATE;

  SELECT count(*) INTO v_current_appointments
  FROM public.appointments
  WHERE business_id = p_business_id
    AND appointment_date >= v_start_of_month
    AND appointment_date <= v_end_of_month
    AND status != 'cancelled';

  v_result := jsonb_build_object(
    'plan', jsonb_build_object(
      'id', v_sub.plan_id,
      'name', v_sub.plan_name,
      'description', v_sub.plan_description,
      'price_monthly', v_sub.price_monthly,
      'price_yearly', v_sub.price_yearly,
      'currency', v_sub.currency
    ),
    'subscription', jsonb_build_object(
      'id', v_sub.id,
      'status', v_sub.status,
      'billing_cycle', v_sub.billing_cycle,
      'current_period_start', v_sub.current_period_start,
      'current_period_end', v_sub.current_period_end,
      'cancel_at_period_end', v_sub.cancel_at_period_end
    ),
    'limits', jsonb_build_object(
      'max_staff', v_limits.max_staff,
      'max_monthly_appointments', v_limits.max_monthly_appointments,
      'max_branches', v_limits.max_branches,
      'max_storage_mb', v_limits.max_storage_mb,
      'features', v_limits.features
    ),
    'usage', jsonb_build_object(
      'current_staff', v_current_staff,
      'current_monthly_appointments', v_current_appointments,
      'period_start', v_start_of_month,
      'period_end', v_end_of_month
    ),
    'checks', jsonb_build_object(
      'can_add_staff', CASE WHEN v_limits.max_staff = -1 THEN true ELSE v_current_staff < v_limits.max_staff END,
      'can_create_appointment', CASE WHEN v_limits.max_monthly_appointments = -1 THEN true ELSE v_current_appointments < v_limits.max_monthly_appointments END
    )
  );

  RETURN v_result;
END;
$$;

-- 7. Actualizar onboarding para inicializar suscripción y límites automáticamente
CREATE OR REPLACE FUNCTION public.init_business_saas_plan(p_business_id UUID, p_plan_id TEXT DEFAULT 'free')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insertar suscripción inicial Free
  INSERT INTO public.subscriptions (
    business_id,
    plan_id,
    status,
    billing_cycle
  )
  VALUES (
    p_business_id,
    p_plan_id,
    'active',
    'free'
  )
  ON CONFLICT (business_id) DO NOTHING;

  -- Insertar límites basados en el plan
  INSERT INTO public.business_limits (
    business_id,
    max_staff,
    max_monthly_appointments,
    max_branches,
    max_storage_mb,
    features
  )
  SELECT 
    p_business_id,
    (default_limits->>'max_staff')::INTEGER,
    (default_limits->>'max_monthly_appointments')::INTEGER,
    (default_limits->>'max_branches')::INTEGER,
    (default_limits->>'max_storage_mb')::INTEGER,
    features
  FROM public.plans
  WHERE id = p_plan_id
  ON CONFLICT (business_id) DO NOTHING;
END;
$$;

-- Backfill para todos los negocios existentes que aún no tengan suscripción
DO $$
DECLARE
  b RECORD;
BEGIN
  FOR b IN SELECT id FROM public.businesses LOOP
    PERFORM public.init_business_saas_plan(b.id, 'free');
  END LOOP;
END;
$$;

-- 8. Seguridad RLS para las nuevas tablas
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_usage ENABLE ROW LEVEL SECURITY;

-- Plans: cualquiera puede consultar los planes públicos (anon y autenticados)
DROP POLICY IF EXISTS "Public can view plans" ON public.plans;
CREATE POLICY "Public can view plans" ON public.plans
  FOR SELECT
  TO public, anon, authenticated
  USING (is_active = true);

-- Subscriptions: solo miembros del negocio pueden ver su suscripción
DROP POLICY IF EXISTS "Business members can view their subscription" ON public.subscriptions;
CREATE POLICY "Business members can view their subscription" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

-- Business Limits: miembros pueden ver los límites de su negocio
DROP POLICY IF EXISTS "Business members can view their limits" ON public.business_limits;
CREATE POLICY "Business members can view their limits" ON public.business_limits
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

-- Business Usage: miembros pueden ver el uso de su negocio
DROP POLICY IF EXISTS "Business members can view their usage" ON public.business_usage;
CREATE POLICY "Business members can view their usage" ON public.business_usage
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

-- Permisos sobre funciones RPC
GRANT EXECUTE ON FUNCTION public.can_add_staff(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_create_appointment(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_use_feature(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_business_plan_and_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.init_business_saas_plan(UUID, TEXT) TO authenticated;
