-- Agrega timestamps de completado y pago al RPC de reporte por estilista.

DROP FUNCTION IF EXISTS public.get_stylist_service_report_appointments(date, date, text);

CREATE OR REPLACE FUNCTION public.get_stylist_service_report_appointments(
  p_start_date date,
  p_end_date date,
  p_status text DEFAULT 'todos'
)
RETURNS TABLE (
  appointment_id uuid,
  appointment_date timestamp with time zone,
  completed_at timestamp with time zone,
  paid_at timestamp with time zone,
  appointment_status text,
  is_paid boolean,
  ready_for_billing boolean,
  service_id uuid,
  service_name text,
  service_price numeric,
  stylist_id uuid,
  stylist_name text,
  client_name text,
  invoice_number text,
  discount_percentage numeric,
  discount_amount numeric
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_salon_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'stylist', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para consultar reportes.';
  END IF;

  RETURN QUERY
  SELECT
    a.id AS appointment_id,
    a.appointment_date,
    a.ready_for_billing_at AS completed_at,
    si.paid_at,
    a.status AS appointment_status,
    COALESCE(a.is_paid, false) AS is_paid,
    COALESCE(a.ready_for_billing, false) AS ready_for_billing,
    a.service_id,
    s.name AS service_name,
    s.price AS service_price,
    a.stylist_id,
    COALESCE(st.full_name, 'Sin asignar') AS stylist_name,
    c.full_name AS client_name,
    si.invoice_number,
    COALESCE(si.discount_percentage, 0) AS discount_percentage,
    COALESCE(si.discount_amount, 0) AS discount_amount
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN LATERAL (
    SELECT
      i.discount_percentage,
      i.discount_amount,
      p.invoice_number,
      p.created_at AS paid_at
    FROM public.sale_items i
    LEFT JOIN public.product_sales p ON p.id = i.sale_id
    WHERE i.appointment_id = a.id
    ORDER BY i.created_at DESC NULLS LAST
    LIMIT 1
  ) si ON true
  WHERE a.appointment_date::date BETWEEN p_start_date AND p_end_date
    AND (v_role = 'superadmin' OR a.salon_id = v_salon_id)
    AND (
      p_status = 'todos'
      OR (p_status = 'pagados' AND COALESCE(a.is_paid, false) = true AND a.status <> 'cancelada')
      OR (p_status = 'pendientes_facturar' AND COALESCE(a.ready_for_billing, false) = true AND COALESCE(a.is_paid, false) = false AND a.status <> 'cancelada')
      OR (p_status = 'cancelados' AND a.status = 'cancelada')
    )
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
