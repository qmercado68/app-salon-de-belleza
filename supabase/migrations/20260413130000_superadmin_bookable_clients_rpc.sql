-- RPC para listar clientes reservables por superadmin (opcionalmente por salón)

CREATE OR REPLACE FUNCTION public.get_superadmin_bookable_clients(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  avatar_url text,
  salon_id uuid,
  status text,
  created_at timestamp with time zone
) AS $$
BEGIN
  IF public.get_my_role() <> 'superadmin' THEN
    RAISE EXCEPTION 'Solo superadmin puede consultar esta función';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.avatar_url,
    p.salon_id,
    p.status,
    p.created_at
  FROM public.profiles p
  WHERE p.role = 'client'
    AND (p_salon_id IS NULL OR p.salon_id = p_salon_id)
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
