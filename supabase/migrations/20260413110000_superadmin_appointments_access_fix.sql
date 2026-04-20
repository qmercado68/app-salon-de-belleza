-- Refuerzo de permisos para superadmin en perfiles y citas.
-- Asegura lectura global de calendario y creación/gestión de citas.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_superadmin_all" ON public.profiles;
CREATE POLICY "profiles_superadmin_all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

DROP POLICY IF EXISTS "appointments_superadmin_all" ON public.appointments;
CREATE POLICY "appointments_superadmin_all"
  ON public.appointments FOR ALL
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');
