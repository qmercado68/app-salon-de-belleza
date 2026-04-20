-- Directorio de usuarios vía RPC SECURITY DEFINER para evitar recursión RLS en profiles.

CREATE OR REPLACE FUNCTION public.get_user_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  first_name text,
  second_name text,
  last_name text,
  second_last_name text,
  email text,
  phone text,
  role text,
  status text,
  salon_id uuid,
  created_at timestamp with time zone
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_salon_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para ver el directorio de usuarios.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.first_name,
    p.second_name,
    p.last_name,
    p.second_last_name,
    p.email,
    p.phone,
    p.role,
    COALESCE(p.status, 'active') AS status,
    p.salon_id,
    p.created_at
  FROM public.profiles p
  WHERE
    v_role = 'superadmin'
    OR p.salon_id = v_salon_id
    OR p.id = auth.uid()
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
