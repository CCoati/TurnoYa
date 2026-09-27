-- ==============================================================================
-- TurnosYa: Parches Críticos de Auditoría Pre-Producción
-- Migración: 20260927210000_production_readiness_audit_fixes.sql
-- ==============================================================================
-- 1. RPC change_business_plan: Permite a admins/owners cambiar el plan de suscripción y actualiza límites efectivos.
-- 2. book_appointment: Valida can_create_appointment a nivel BD y resuelve desfase de timezone (v_curr_date_local).
-- 3. get_available_slots: Resuelve desfase de timezone (v_curr_date_local).
-- 4. Trigger en public.staff: Impide inserciones que excedan el límite del plan (can_add_staff).
-- 5. Índices compuestos en public.appointments: Optimiza consultas de calendario, cuota mensual y búsqueda por teléfono.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: change_business_plan
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.change_business_plan(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.change_business_plan(
  p_business_id UUID,
  p_plan_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan RECORD;
  v_is_authorized BOOLEAN;
BEGIN
  -- 1. Validar autorización (Owner o Admin del negocio)
  v_is_authorized := public.is_business_admin(p_business_id);
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'No tienes permisos de administrador para cambiar el plan de este negocio.';
  END IF;

  -- 2. Validar que el plan exista y esté activo
  SELECT * INTO v_plan
  FROM public.plans
  WHERE id = p_plan_id AND is_active = true;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'El plan especificado no es válido o se encuentra inactivo.';
  END IF;

  -- 3. Actualizar o crear suscripción
  INSERT INTO public.subscriptions (
    business_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    updated_at
  )
  VALUES (
    p_business_id,
    p_plan_id,
    'active',
    CASE WHEN p_plan_id = 'free' THEN 'free' ELSE 'monthly' END,
    now(),
    now() + interval '1 month',
    now()
  )
  ON CONFLICT (business_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    billing_cycle = EXCLUDED.billing_cycle,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

  -- 4. Actualizar límites efectivos del negocio
  INSERT INTO public.business_limits (
    business_id,
    max_staff,
    max_monthly_appointments,
    max_branches,
    max_storage_mb,
    features,
    updated_at
  )
  VALUES (
    p_business_id,
    (v_plan.default_limits->>'max_staff')::INTEGER,
    (v_plan.default_limits->>'max_monthly_appointments')::INTEGER,
    (v_plan.default_limits->>'max_branches')::INTEGER,
    (v_plan.default_limits->>'max_storage_mb')::INTEGER,
    v_plan.features,
    now()
  )
  ON CONFLICT (business_id) DO UPDATE SET
    max_staff = EXCLUDED.max_staff,
    max_monthly_appointments = EXCLUDED.max_monthly_appointments,
    max_branches = EXCLUDED.max_branches,
    max_storage_mb = EXCLUDED.max_storage_mb,
    features = EXCLUDED.features,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'plan_id', p_plan_id,
    'plan_name', v_plan.name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_business_plan(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Trigger en public.staff: Protección estricta de cupo en base de datos
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_staff_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = true AND NOT public.can_add_staff(NEW.business_id) THEN
    RAISE EXCEPTION 'El negocio ha alcanzado el límite de profesionales activos permitidos por su plan.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_staff_limit ON public.staff;
CREATE TRIGGER trg_check_staff_limit
  BEFORE INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.check_staff_limit_trigger();

-- ------------------------------------------------------------------------------
-- 3. get_available_slots con resolución de Timezone local
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_business_id UUID,
  p_staff_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_slot_interval INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_start TIME,
  slot_end TIME,
  slot_duration INTEGER,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_open BOOLEAN;
  v_open_time TIME;
  v_close_time TIME;
  v_service_duration INTEGER;
  v_staff_active BOOLEAN;
  v_service_active BOOLEAN;
  v_timezone TEXT;
  v_curr_date_local DATE;
  v_curr_time_local TIME;
  v_step_interval INTERVAL;
  v_curr_slot_start TIME;
  v_curr_slot_end TIME;
  v_is_overlap BOOLEAN;
BEGIN
  -- Obtener zona horaria del negocio
  SELECT coalesce(bs.timezone, 'America/Argentina/Buenos_Aires')
  INTO v_timezone
  FROM public.business_settings bs
  WHERE bs.business_id = p_business_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'America/Argentina/Buenos_Aires';
  END IF;

  v_curr_date_local := (timezone(v_timezone, now()))::date;
  v_curr_time_local := (timezone(v_timezone, now()))::time;

  -- Validar que no sea fecha en el pasado según el huso horario local del negocio
  IF p_date < v_curr_date_local THEN
    RETURN;
  END IF;

  SELECT st.active INTO v_staff_active
  FROM public.staff st
  WHERE st.id = p_staff_id AND st.business_id = p_business_id;

  IF v_staff_active IS NOT TRUE THEN
    RETURN;
  END IF;

  SELECT sv.duration_minutes, sv.active INTO v_service_duration, v_service_active
  FROM public.services sv
  WHERE sv.id = p_service_id AND sv.business_id = p_business_id;

  IF v_service_active IS NOT TRUE OR v_service_duration IS NULL OR v_service_duration <= 0 THEN
    RETURN;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;

  SELECT bh.is_open, bh.open_time, bh.close_time
  INTO v_is_open, v_open_time, v_close_time
  FROM public.business_hours bh
  WHERE bh.business_id = p_business_id AND bh.day_of_week = v_day_of_week;

  IF v_is_open IS NOT TRUE OR v_open_time IS NULL OR v_close_time IS NULL OR v_open_time >= v_close_time THEN
    RETURN;
  END IF;

  v_step_interval := (GREATEST(15, coalesce(p_slot_interval, 30)) || ' minutes')::interval;
  v_curr_slot_start := v_open_time;

  WHILE (v_curr_slot_start + (v_service_duration || ' minutes')::interval)::time <= v_close_time LOOP
    v_curr_slot_end := (v_curr_slot_start + (v_service_duration || ' minutes')::interval)::time;

    -- Si la fecha es hoy en el huso horario local, no mostrar horarios ya transcurridos
    IF p_date = v_curr_date_local AND v_curr_slot_start <= v_curr_time_local THEN
      v_curr_slot_start := (v_curr_slot_start + v_step_interval)::time;
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.appointments ap
      WHERE ap.staff_id = p_staff_id
        AND ap.appointment_date = p_date
        AND ap.status != 'cancelled'
        AND tsrange((p_date + ap.start_time), (p_date + ap.end_time), '[)')
            && tsrange((p_date + v_curr_slot_start), (p_date + v_curr_slot_end), '[)')
    ) INTO v_is_overlap;

    IF NOT v_is_overlap THEN
      slot_start := v_curr_slot_start;
      slot_end := v_curr_slot_end;
      slot_duration := v_service_duration;
      is_available := true;
      RETURN NEXT;
    END IF;

    v_curr_slot_start := (v_curr_slot_start + v_step_interval)::time;

    IF v_curr_slot_start < v_open_time THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. book_appointment con validación de cuota SaaS y resolución de Timezone local
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_business_id UUID,
  p_staff_id UUID,
  p_service_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_service_duration INTEGER;
  v_service_name TEXT;
  v_staff_name TEXT;
  v_day_of_week INTEGER;
  v_is_open BOOLEAN;
  v_open_time TIME;
  v_close_time TIME;
  v_end_time TIME;
  v_timezone TEXT;
  v_curr_date_local DATE;
  v_curr_time_local TIME;
  v_new_appointment RECORD;
BEGIN
  -- Validaciones básicas de entrada
  IF trim(p_customer_name) IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'El nombre del cliente debe tener al menos 2 caracteres.';
  END IF;

  IF trim(p_customer_phone) IS NULL OR length(trim(p_customer_phone)) < 6 THEN
    RAISE EXCEPTION 'El teléfono del cliente no es válido.';
  END IF;

  -- 1. Validar cuota mensual del plan SaaS
  IF NOT public.can_create_appointment(p_business_id) THEN
    RAISE EXCEPTION 'El negocio ha alcanzado el límite mensual de reservas de su plan actual.';
  END IF;

  -- 2. Obtener zona horaria del negocio
  SELECT coalesce(timezone, 'America/Argentina/Buenos_Aires')
  INTO v_timezone
  FROM public.business_settings
  WHERE business_id = p_business_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'America/Argentina/Buenos_Aires';
  END IF;

  v_curr_date_local := (timezone(v_timezone, now()))::date;
  v_curr_time_local := (timezone(v_timezone, now()))::time;

  -- Validar fechas pasadas en huso horario local
  IF p_appointment_date < v_curr_date_local THEN
    RAISE EXCEPTION 'No se pueden agendar citas en fechas pasadas.';
  END IF;

  IF p_appointment_date = v_curr_date_local AND p_start_time <= v_curr_time_local THEN
    RAISE EXCEPTION 'La hora seleccionada ya ha transcurrido el día de hoy.';
  END IF;

  -- 3. Validar profesional activo
  SELECT name INTO v_staff_name
  FROM public.staff
  WHERE id = p_staff_id AND business_id = p_business_id AND active = true;

  IF v_staff_name IS NULL THEN
    RAISE EXCEPTION 'El profesional seleccionado no está disponible o no existe.';
  END IF;

  -- 4. Validar servicio y duración
  SELECT name, duration_minutes INTO v_service_name, v_service_duration
  FROM public.services
  WHERE id = p_service_id AND business_id = p_business_id AND active = true;

  IF v_service_duration IS NULL OR v_service_duration <= 0 THEN
    RAISE EXCEPTION 'El servicio seleccionado no está activo o no existe.';
  END IF;

  v_end_time := (p_start_time + (v_service_duration || ' minutes')::interval)::time;

  -- 5. Validar horarios de atención del negocio
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date)::integer;

  SELECT is_open, open_time, close_time
  INTO v_is_open, v_open_time, v_close_time
  FROM public.business_hours
  WHERE business_id = p_business_id AND day_of_week = v_day_of_week;

  IF v_is_open IS NOT TRUE THEN
    RAISE EXCEPTION 'El negocio se encuentra cerrado este día.';
  END IF;

  IF p_start_time < v_open_time THEN
    RAISE EXCEPTION 'La cita inicia antes del horario de apertura (%s).', v_open_time;
  END IF;

  IF v_end_time > v_close_time THEN
    RAISE EXCEPTION 'La cita excede el horario de cierre del negocio (%s). Duración: %s minutos.', v_close_time, v_service_duration;
  END IF;

  -- 6. Insertar cita con protección anti-solapamiento (Exclusion Constraint prevent_staff_appointment_overlap)
  BEGIN
    INSERT INTO public.appointments (
      business_id,
      staff_id,
      service_id,
      customer_name,
      customer_phone,
      appointment_date,
      start_time,
      end_time,
      status,
      notes
    )
    VALUES (
      p_business_id,
      p_staff_id,
      p_service_id,
      trim(p_customer_name),
      trim(p_customer_phone),
      p_appointment_date,
      p_start_time,
      v_end_time,
      'confirmed',
      nullif(trim(p_notes), '')
    )
    RETURNING
      id,
      business_id,
      staff_id,
      service_id,
      customer_name,
      customer_phone,
      appointment_date,
      start_time,
      end_time,
      status,
      notes,
      created_at
    INTO v_new_appointment;

  EXCEPTION
    WHEN exclusion_violation THEN
      RAISE EXCEPTION 'El horario seleccionado (%s - %s) ya no está disponible para %s. Por favor selecciona otro turno.',
        p_start_time, v_end_time, v_staff_name;
    WHEN check_violation THEN
      RAISE EXCEPTION 'Los datos de la reserva no cumplen con los límites de horario permitidos.';
  END;

  RETURN jsonb_build_object(
    'id', v_new_appointment.id,
    'business_id', v_new_appointment.business_id,
    'staff_id', v_new_appointment.staff_id,
    'staff_name', v_staff_name,
    'service_id', v_new_appointment.service_id,
    'service_name', v_service_name,
    'customer_name', v_new_appointment.customer_name,
    'customer_phone', v_new_appointment.customer_phone,
    'appointment_date', v_new_appointment.appointment_date,
    'start_time', v_new_appointment.start_time,
    'end_time', v_new_appointment.end_time,
    'duration_minutes', v_service_duration,
    'status', v_new_appointment.status,
    'notes', v_new_appointment.notes,
    'created_at', v_new_appointment.created_at
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Índices Compuestos de Alta Velocidad en public.appointments
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_business_date_status
  ON public.appointments(business_id, appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone
  ON public.appointments(customer_phone);
