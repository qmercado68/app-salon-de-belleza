-- RPC para catálogo de gestión de servicios (admin/superadmin), evitando filtros RLS ambiguos.

CREATE OR REPLACE FUNCTION public.get_manageable_services(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_minutes integer,
  price numeric,
  category text,
  tax_treatment text,
  image_url text,
  is_active boolean,
  salon_id uuid
) AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_my_salon
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para gestionar servicios.';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.category,
    s.tax_treatment,
    s.image_url,
    s.is_active,
    s.salon_id
  FROM public.services s
  WHERE (
    (v_role = 'superadmin' AND (p_salon_id IS NULL OR s.salon_id = p_salon_id OR s.salon_id IS NULL))
    OR (v_role = 'admin' AND (s.salon_id = v_my_salon OR s.salon_id IS NULL))
  )
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
