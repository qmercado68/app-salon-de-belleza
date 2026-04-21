-- RPC para obtener estilistas reservables en BookView
-- evitando bloqueos de RLS por perfiles.

CREATE OR REPLACE FUNCTION public.get_bookable_stylists(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  specialty text,
  avatar_url text,
  medical_conditions text,
  work_start_time time,
  work_end_time time,
  break_start_time time,
  break_end_time time,
  is_available boolean,
  salon_id uuid,
  status text
) AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
BEGIN
  v_role := public.get_my_role();
  v_my_salon := public.get_my_salon_id();

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.specialty,
    p.avatar_url,
    p.medical_conditions,
    p.work_start_time,
    p.work_end_time,
    p.break_start_time,
    p.break_end_time,
    p.is_available,
    p.salon_id,
    p.status
  FROM public.profiles p
  WHERE p.role = 'stylist'
    AND COALESCE(p.status, 'active') <> 'terminated'
    AND (
      (v_role = 'superadmin' AND (p_salon_id IS NULL OR p.salon_id = p_salon_id OR p.salon_id IS NULL))
      OR (v_role <> 'superadmin' AND (p.salon_id = v_my_salon OR p.salon_id IS NULL))
    )
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
