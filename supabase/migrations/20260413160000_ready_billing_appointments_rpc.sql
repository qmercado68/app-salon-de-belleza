-- RPC para listar citas autorizadas para facturación en POS

DROP FUNCTION IF EXISTS public.get_ready_for_billing_appointments(date);

CREATE OR REPLACE FUNCTION public.get_ready_for_billing_appointments(p_date date)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  service_id uuid,
  stylist_id uuid,
  appointment_date timestamp with time zone,
  status text,
  payment_method text,
  is_paid boolean,
  ready_for_billing boolean,
  ready_for_billing_at timestamp with time zone,
  ready_for_billing_by uuid,
  canceled_at timestamp with time zone,
  canceled_by uuid,
  notes text,
  salon_id uuid,
  service_name text,
  service_price numeric,
  service_tax_treatment text,
  client_name text,
  stylist_name text,
  salon_name text
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  v_role := public.get_my_role();
  v_salon_id := public.get_my_salon_id();

  IF v_role NOT IN ('client', 'stylist', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para consultar citas de facturación.';
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
    a.ready_for_billing,
    a.ready_for_billing_at,
    a.ready_for_billing_by,
    a.canceled_at,
    a.canceled_by,
    a.notes,
    a.salon_id,
    s.name AS service_name,
    s.price AS service_price,
    COALESCE(s.tax_treatment, 'gravado') AS service_tax_treatment,
    c.full_name AS client_name,
    st.full_name AS stylist_name,
    sl.name AS salon_name
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  LEFT JOIN public.salons sl ON sl.id = a.salon_id
  WHERE a.appointment_date::date = p_date
    AND a.is_paid = false
    AND a.ready_for_billing = true
    AND a.status <> 'cancelada'
    AND (
      v_role = 'superadmin'
      OR (v_role IN ('admin', 'stylist') AND a.salon_id = v_salon_id)
      OR (v_role = 'client' AND a.client_id = auth.uid())
    )
  ORDER BY a.appointment_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
