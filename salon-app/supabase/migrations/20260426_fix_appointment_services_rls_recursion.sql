-- Fix: evitar recursión RLS en appointment_services
-- La policy original consultaba public.profiles dentro de USING,
-- causando "infinite recursion detected in policy for relation profiles".
-- Migrado al helper SECURITY DEFINER public.get_my_role() (lee del JWT).

DROP POLICY IF EXISTS "appointment_services_admin" ON public.appointment_services;

CREATE POLICY "appointment_services_admin" ON public.appointment_services
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));
