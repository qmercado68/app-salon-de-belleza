-- RPC para obtener servicios reservables en BookView evitando bloqueos por RLS.

CREATE OR REPLACE FUNCTION public.get_bookable_services(p_salon_id uuid DEFAULT NULL)
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
  v_role := public.get_my_role();
  v_my_salon := public.get_my_salon_id();

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
  WHERE s.is_active = true
    AND (
      (v_role = 'superadmin' AND (p_salon_id IS NULL OR s.salon_id = p_salon_id OR s.salon_id IS NULL))
      OR (v_role <> 'superadmin' AND (s.salon_id = v_my_salon OR s.salon_id IS NULL))
    )
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
