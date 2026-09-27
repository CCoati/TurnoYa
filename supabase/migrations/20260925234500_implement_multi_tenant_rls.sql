-- ==============================================================================
-- TurnosYa: Seguridad Multi-Tenant con Row Level Security (RLS) en PostgreSQL
-- Migración: 20260925234500_implement_multi_tenant_rls.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIONES SQL AUXILIARES (SECURITY DEFINER + STABLE)
-- Evitan recursión infinita en RLS y protegen el aislamiento multi-tenant.
-- ------------------------------------------------------------------------------

-- Verifica si auth.uid() pertenece al negocio target
CREATE OR REPLACE FUNCTION public.user_belongs_to_business(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
  );
$$;

-- Obtiene el rol del usuario actual en el negocio
CREATE OR REPLACE FUNCTION public.get_business_role(target_business_id UUID)
RETURNS member_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT role
  FROM public.business_members
  WHERE business_id = target_business_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- Verifica si el usuario actual es 'owner' del negocio
CREATE OR REPLACE FUNCTION public.is_business_owner(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
      AND role = 'owner'::member_role
  );
$$;

-- Verifica si el usuario actual es 'owner' o 'admin' del negocio
CREATE OR REPLACE FUNCTION public.is_business_admin(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
      AND role IN ('owner'::member_role, 'admin'::member_role)
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. TRIGGER AUTOMÁTICO AL CREAR UN NEGOCIO
-- Asegura que el usuario creador quede asignado como OWNER sin agujeros de RLS
-- e inicializa la configuración predeterminada de negocio (1 a 1).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_business()
RETURNS trigger AS $$
BEGIN
  -- Asignar al creador como OWNER en business_members
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner'::member_role)
    ON CONFLICT (business_id, user_id) DO NOTHING;
  END IF;

  -- Inicializar settings predeterminados (1 a 1)
  INSERT INTO public.business_settings (business_id, timezone, currency, booking_enabled)
  VALUES (NEW.id, 'America/Argentina/Buenos_Aires', 'ARS', true)
  ON CONFLICT (business_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_business_created ON public.businesses;
CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_business();

-- ------------------------------------------------------------------------------
-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS: profiles
-- Cada usuario solo puede ver, insertar y modificar su propio perfil.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS: businesses
-- Un usuario solo accede a negocios a los que pertenece.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their businesses" ON public.businesses;
CREATE POLICY "Members can view their businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(id));

DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins and owners can update their business" ON public.businesses;
CREATE POLICY "Admins and owners can update their business"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(id))
  WITH CHECK (public.is_business_admin(id));

DROP POLICY IF EXISTS "Owners can delete their business" ON public.businesses;
CREATE POLICY "Owners can delete their business"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(id));

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS: business_members (Crítica contra escalación de privilegios)
-- Nadie puede auto-agregarse como owner de negocios ajenos.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view colleagues in their business" ON public.business_members;
CREATE POLICY "Members can view colleagues in their business"
  ON public.business_members
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Owners and admins can add members" ON public.business_members;
CREATE POLICY "Owners and admins can add members"
  ON public.business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_business_owner(business_id)
    OR (public.is_business_admin(business_id) AND role = 'staff'::member_role)
  );

DROP POLICY IF EXISTS "Owners and admins can update members" ON public.business_members;
CREATE POLICY "Owners and admins can update members"
  ON public.business_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_business_owner(business_id)
    OR (public.is_business_admin(business_id) AND role = 'staff'::member_role)
  )
  WITH CHECK (
    public.is_business_owner(business_id)
    OR (public.is_business_admin(business_id) AND role = 'staff'::member_role)
  );

DROP POLICY IF EXISTS "Members can leave or be removed by admins/owners" ON public.business_members;
CREATE POLICY "Members can leave or be removed by admins/owners"
  ON public.business_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_business_owner(business_id)
    OR (public.is_business_admin(business_id) AND role = 'staff'::member_role)
    OR (user_id = auth.uid() AND role != 'owner'::member_role)
  );

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS: staff
-- Solo miembros del negocio pueden ver; solo admins/owners pueden gestionar.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view staff in their business" ON public.staff;
CREATE POLICY "Members can view staff in their business"
  ON public.staff
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Admins can add staff" ON public.staff;
CREATE POLICY "Admins can add staff"
  ON public.staff
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins and self staff can update staff profile" ON public.staff;
CREATE POLICY "Admins and self staff can update staff profile"
  ON public.staff
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(business_id) OR (user_id IS NOT NULL AND user_id = auth.uid()))
  WITH CHECK (public.is_business_admin(business_id) OR (user_id IS NOT NULL AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete staff" ON public.staff;
CREATE POLICY "Admins can delete staff"
  ON public.staff
  FOR DELETE
  TO authenticated
  USING (public.is_business_admin(business_id));

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS: services
-- Solo miembros ven servicios; admins/owners gestionan catálogo.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view services in their business" ON public.services;
CREATE POLICY "Members can view services in their business"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Admins can add services" ON public.services;
CREATE POLICY "Admins can add services"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(business_id))
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
  ON public.services
  FOR DELETE
  TO authenticated
  USING (public.is_business_admin(business_id));

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS: business_hours
-- Solo miembros ven horarios; admins/owners los modifican.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view hours in their business" ON public.business_hours;
CREATE POLICY "Members can view hours in their business"
  ON public.business_hours
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Admins can insert business hours" ON public.business_hours;
CREATE POLICY "Admins can insert business hours"
  ON public.business_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins can update business hours" ON public.business_hours;
CREATE POLICY "Admins can update business hours"
  ON public.business_hours
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(business_id))
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins can delete business hours" ON public.business_hours;
CREATE POLICY "Admins can delete business hours"
  ON public.business_hours
  FOR DELETE
  TO authenticated
  USING (public.is_business_admin(business_id));

-- ------------------------------------------------------------------------------
-- 10. POLÍTICAS: business_settings
-- Solo miembros ven configuración; admins/owners actualizan.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view settings in their business" ON public.business_settings;
CREATE POLICY "Members can view settings in their business"
  ON public.business_settings
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Admins can insert business settings" ON public.business_settings;
CREATE POLICY "Admins can insert business settings"
  ON public.business_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Admins can update business settings" ON public.business_settings;
CREATE POLICY "Admins can update business settings"
  ON public.business_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_business_admin(business_id))
  WITH CHECK (public.is_business_admin(business_id));

DROP POLICY IF EXISTS "Owners can delete business settings" ON public.business_settings;
CREATE POLICY "Owners can delete business settings"
  ON public.business_settings
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- ------------------------------------------------------------------------------
-- 11. POLÍTICAS: appointments
-- Solo miembros del negocio correspondiente pueden leer, crear o actualizar turnos.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view appointments in their business" ON public.appointments;
CREATE POLICY "Members can view appointments in their business"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Members can create appointments in their business" ON public.appointments;
CREATE POLICY "Members can create appointments in their business"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Members can update appointments in their business" ON public.appointments;
CREATE POLICY "Members can update appointments in their business"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (public.user_belongs_to_business(business_id))
  WITH CHECK (public.user_belongs_to_business(business_id));

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_business_admin(business_id));
