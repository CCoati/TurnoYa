-- ==============================================================================
-- MIGRACIÓN: Motor de Reservas y Prevención de Solapamiento en PostgreSQL
-- Fecha: 2026-09-27
-- Descripción:
--   1. Habilita btree_gist para indexación GiST en escalares.
--   2. Agrega Exclusion Constraint en public.appointments para solapamiento cero.
--   3. RPC get_available_slots: cálculo de disponibilidad en base a horarios,
--      duración de servicio y citas no canceladas.
--   4. RPC book_appointment: inserción atómica y transaccional anti race-conditions.
-- ==============================================================================

-- 1. Habilitar extensión btree_gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Exclusion Constraint en public.appointments (Garantía física a nivel BD)
-- Si ya existe la restricción, la recrea para asegurar la condición WHERE (status != 'cancelled')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prevent_staff_appointment_overlap'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT prevent_staff_appointment_overlap
    EXCLUDE USING gist (
      staff_id WITH =,
      tsrange((appointment_date + start_time), (appointment_date + end_time), '[)') WITH &&
    )
    WHERE (status != 'cancelled');
  END IF;
END $$;

-- 3. Función RPC: get_available_slots
-- Calcula los horarios disponibles basándose en:
-- - Horarios comerciales del negocio (business_hours) para ese día de la semana
-- - Duración del servicio (start_time + duration <= close_time)
-- - Citas existentes del profesional que NO estén canceladas
-- - Horas pasadas (si la fecha es hoy)
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
  v_curr_time_local TIME;
  v_step_interval INTERVAL;
  v_curr_slot_start TIME;
  v_curr_slot_end TIME;
  v_is_overlap BOOLEAN;
BEGIN
  IF p_date < CURRENT_DATE THEN
    RETURN;
  END IF;

  SELECT coalesce(bs.timezone, 'America/Argentina/Buenos_Aires')
  INTO v_timezone
  FROM public.business_settings bs
  WHERE bs.business_id = p_business_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'America/Argentina/Buenos_Aires';
  END IF;

  v_curr_time_local := (timezone(v_timezone, now()))::time;

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

    IF p_date = CURRENT_DATE AND v_curr_slot_start <= v_curr_time_local THEN
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

-- 4. Función RPC: book_appointment
-- Reserva atómica y transaccional con validaciones de negocio y protección anti race-condition
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

  -- 1. No permitir reservas en el pasado
  IF p_appointment_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden agendar citas en fechas pasadas.';
  END IF;

  -- 2. Obtener zona horaria del negocio
  SELECT coalesce(timezone, 'America/Argentina/Buenos_Aires')
  INTO v_timezone
  FROM public.business_settings
  WHERE business_id = p_business_id;

  IF v_timezone IS NULL THEN
    v_timezone := 'America/Argentina/Buenos_Aires';
  END IF;

  v_curr_time_local := (timezone(v_timezone, now()))::time;

  IF p_appointment_date = CURRENT_DATE AND p_start_time <= v_curr_time_local THEN
    RAISE EXCEPTION 'La hora seleccionada ya ha transcurrido el día de hoy.';
  END IF;

  -- 3. Validar profesional
  SELECT name INTO v_staff_name
  FROM public.staff
  WHERE id = p_staff_id AND business_id = p_business_id AND active = true;

  IF v_staff_name IS NULL THEN
    RAISE EXCEPTION 'El profesional seleccionado no está disponible o no existe.';
  END IF;

  -- 4. Validar servicio y calcular duración
  SELECT name, duration_minutes INTO v_service_name, v_service_duration
  FROM public.services
  WHERE id = p_service_id AND business_id = p_business_id AND active = true;

  IF v_service_duration IS NULL OR v_service_duration <= 0 THEN
    RAISE EXCEPTION 'El servicio seleccionado no está activo o no existe.';
  END IF;

  -- Calcular hora de fin
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

  -- 6. Insertar cita con protección anti-solapamiento
  -- Si dos usuarios intentan reservar concurrentemente el mismo turno,
  -- el exclusion constraint 'prevent_staff_appointment_overlap' lanzará 'exclusion_violation'
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
      'confirmed', -- Se confirma al crearse directamente
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

  -- Retornar resultado formateado en JSON
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

-- Otorgar permisos de ejecución para authenticated y anon (booking público)
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, UUID, UUID, DATE, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, UUID, UUID, DATE, TIME, TEXT, TEXT, TEXT) TO authenticated, anon;
