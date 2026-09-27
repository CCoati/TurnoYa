-- ==============================================================================
-- TurnosYa: Flujo de Onboarding Transaccional de Negocios Multi-Tenant
-- Migración: 20260925235500_business_onboarding_and_category.sql
-- ==============================================================================

-- 1. Agregar columna category a businesses si no existe
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN category TEXT NOT NULL DEFAULT 'barbershop';
  END IF;
END $$;

-- 2. Función transaccional de Onboarding: crea negocio, owner, settings y horarios en 1 sola transacción
CREATE OR REPLACE FUNCTION public.create_business_onboarding(
  p_name TEXT,
  p_slug TEXT,
  p_category TEXT DEFAULT 'barbershop',
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  p_currency VARCHAR(10) DEFAULT 'ARS',
  p_booking_enabled BOOLEAN DEFAULT true,
  p_open_time TIME DEFAULT '09:00'::TIME,
  p_close_time TIME DEFAULT '20:00'::TIME,
  p_open_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_business_id UUID;
  v_cleaned_slug TEXT;
  v_day INTEGER;
  v_user_id UUID;
BEGIN
  -- Validar que el usuario esté autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado. Debes iniciar sesión para crear un negocio.';
  END IF;

  -- Validar nombre
  IF trim(p_name) IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'El nombre del negocio debe tener al menos 2 caracteres.';
  END IF;

  -- Limpiar y formatear slug
  v_cleaned_slug := lower(trim(p_slug));
  v_cleaned_slug := regexp_replace(v_cleaned_slug, '[^a-z0-9\-]+', '-', 'g');
  v_cleaned_slug := regexp_replace(v_cleaned_slug, '^-+|-+$', '', 'g');

  IF length(v_cleaned_slug) < 2 THEN
    RAISE EXCEPTION 'El identificador web (slug) no es válido.';
  END IF;

  -- Validar unicidad de slug
  IF EXISTS (SELECT 1 FROM public.businesses WHERE businesses.slug = v_cleaned_slug) THEN
    RAISE EXCEPTION 'El identificador web "%" ya está en uso. Por favor elige otro.', v_cleaned_slug;
  END IF;

  -- 1. Crear el Negocio
  INSERT INTO public.businesses (
    name,
    slug,
    category,
    phone,
    address,
    description,
    active
  )
  VALUES (
    trim(p_name),
    v_cleaned_slug,
    coalesce(nullif(trim(p_category), ''), 'barbershop'),
    nullif(trim(p_phone), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_description), ''),
    true
  )
  RETURNING businesses.id INTO v_business_id;

  -- 2. Asignar al creador como OWNER en business_members
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (v_business_id, v_user_id, 'owner'::member_role)
  ON CONFLICT (business_id, user_id) DO UPDATE
    SET role = 'owner'::member_role;

  -- 3. Crear o actualizar configuración de negocio (1 a 1)
  INSERT INTO public.business_settings (business_id, timezone, currency, booking_enabled)
  VALUES (v_business_id, coalesce(p_timezone, 'America/Argentina/Buenos_Aires'), coalesce(p_currency, 'ARS'), coalesce(p_booking_enabled, true))
  ON CONFLICT (business_id) DO UPDATE
    SET timezone = EXCLUDED.timezone,
        currency = EXCLUDED.currency,
        booking_enabled = EXCLUDED.booking_enabled;

  -- 4. Crear los 7 días de la semana en business_hours
  FOR v_day IN 0..6 LOOP
    IF v_day = ANY(p_open_days) THEN
      INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
      VALUES (v_business_id, v_day::smallint, true, p_open_time, p_close_time)
      ON CONFLICT (business_id, day_of_week) DO UPDATE
        SET is_open = true,
            open_time = p_open_time,
            close_time = p_close_time;
    ELSE
      INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
      VALUES (v_business_id, v_day::smallint, false, NULL, NULL)
      ON CONFLICT (business_id, day_of_week) DO UPDATE
        SET is_open = false,
            open_time = NULL,
            close_time = NULL;
    END IF;
  END LOOP;

  -- Retornar el negocio recién creado
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    b.category,
    b.logo_url,
    b.phone,
    b.email,
    b.address,
    b.description,
    b.active,
    b.created_at,
    b.updated_at
  FROM public.businesses b
  WHERE b.id = v_business_id;
END;
$$;

-- Permisos de ejecución: solo authenticated (nunca anon)
REVOKE EXECUTE ON FUNCTION public.create_business_onboarding(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN, TIME, TIME, INTEGER[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_onboarding(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN, TIME, TIME, INTEGER[]) TO authenticated;
