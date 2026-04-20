-- RPC para que superadmin obtenga citas de calendario sin dependencia de joins RLS

CREATE OR REPLACE FUNCTION public.get_superadmin_calendar_appointments()
RETURNS TABLE (
  id uuid,
  client_id uuid,
  service_id uuid,
  stylist_id uuid,
  appointment_date timestamp with time zone,
  status text,
  payment_method text,
  is_paid boolean,
  notes text,
  salon_id uuid,
  service_name text,
  service_price numeric,
  client_name text,
  client_phone text,
  stylist_name text,
  salon_name text,
  allergies text,
  medical_conditions text,
  medical_form_requested boolean
) AS $$
BEGIN
  IF public.get_my_role() <> 'superadmin' THEN
    RAISE EXCEPTION 'Solo superadmin puede consultar esta función';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.client_id,
    a.service_id,
    a.stylist_id,
    a.appointment_date,
    a.status,
    a.payment_method,
    a.is_paid,
    a.notes,
    a.salon_id,
    s.name AS service_name,
    s.price AS service_price,
    c.full_name AS client_name,
    c.phone AS client_phone,
    st.full_name AS stylist_name,
    sl.name AS salon_name,
    c.allergies,
    c.medical_conditions,
    c.medical_form_requested
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  LEFT JOIN public.salons sl ON sl.id = a.salon_id
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
