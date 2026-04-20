-- Hotfix: evita recursión RLS en profiles al evaluar roles.
-- Fuerza versión no recursiva de get_my_role().

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  -- Preferir rol desde JWT (app_metadata.role)
  IF (auth.jwt() -> 'app_metadata' ? 'role') THEN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'role');
  END IF;

  -- Fallback seguro: leer auth.users, no public.profiles
  RETURN (
    SELECT (u.raw_app_meta_data ->> 'role')
    FROM auth.users u
    WHERE u.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;
