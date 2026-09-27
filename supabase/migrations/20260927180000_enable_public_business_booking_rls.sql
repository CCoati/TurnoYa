-- ==============================================================================
-- MIGRACIÓN: Habilitar lectura pública para páginas públicas de negocios (portal cliente)
-- Fecha: 2026-09-27
-- Descripción:
--   Permite a usuarios no autenticados (anon) consultar información pública
--   del negocio por slug (nombre, logo, descripción, servicios activos,
--   barberos activos, horarios y settings) sin comprometer datos privados
--   ni citas de otros clientes.
-- ==============================================================================

DROP POLICY IF EXISTS "Public and members can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Members can view their businesses" ON public.businesses;
CREATE POLICY "Public and members can view active businesses"
  ON public.businesses
  FOR SELECT
  TO public
  USING (active = true OR (auth.role() = 'authenticated' AND public.user_belongs_to_business(id)));

DROP POLICY IF EXISTS "Public and members can view active services" ON public.services;
DROP POLICY IF EXISTS "Members can view services in their business" ON public.services;
CREATE POLICY "Public and members can view active services"
  ON public.services
  FOR SELECT
  TO public
  USING (
    active = true
    OR (auth.role() = 'authenticated' AND public.user_belongs_to_business(business_id))
  );

DROP POLICY IF EXISTS "Public and members can view active staff" ON public.staff;
DROP POLICY IF EXISTS "Members can view staff in their business" ON public.staff;
CREATE POLICY "Public and members can view active staff"
  ON public.staff
  FOR SELECT
  TO public
  USING (
    active = true
    OR (auth.role() = 'authenticated' AND public.user_belongs_to_business(business_id))
  );

DROP POLICY IF EXISTS "Public and members can view business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Members can view business hours" ON public.business_hours;
CREATE POLICY "Public and members can view business hours"
  ON public.business_hours
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public and members can view business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Members can view business settings" ON public.business_settings;
CREATE POLICY "Public and members can view business settings"
  ON public.business_settings
  FOR SELECT
  TO public
  USING (true);
