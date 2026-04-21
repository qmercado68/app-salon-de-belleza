-- RPC seguro para Dashboard: evita errores por recursión de policies en profiles.

CREATE OR REPLACE FUNCTION public.get_dashboard_appointments_safe()
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_name text,
  service_id uuid,
  service_name text,
  service_price numeric,
  stylist_id uuid,
  stylist_name text,
  appointment_date timestamp with time zone,
  status text,
  payment_method text,
  is_paid boolean,
  salon_id uuid
) AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_salon_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  v_role := COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT u.raw_app_meta_data ->> 'role' FROM auth.users u WHERE u.id = v_uid),
    'client'
  );

  v_salon_id := COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'salon_id', '')::uuid,
    (SELECT NULLIF(u.raw_app_meta_data ->> 'salon_id', '')::uuid FROM auth.users u WHERE u.id = v_uid),
    (SELECT p.salon_id FROM public.profiles p WHERE p.id = v_uid)
  );

  RETURN QUERY
  SELECT
    a.id,
    a.client_id,
    COALESCE(c.full_name, 'Cliente') AS client_name,
    a.service_id,
    COALESCE(s.name, 'Servicio') AS service_name,
    COALESCE(s.price, 0) AS service_price,
    a.stylist_id,
    COALESCE(st.full_name, 'Sin asignar') AS stylist_name,
    a.appointment_date,
    a.status,
    COALESCE(a.payment_method, 'efectivo') AS payment_method,
    COALESCE(a.is_paid, false) AS is_paid,
    a.salon_id
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  WHERE
    (v_role = 'superadmin')
    OR (v_role IN ('admin', 'stylist') AND a.salon_id = v_salon_id)
    OR (v_role = 'client' AND a.client_id = v_uid)
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
