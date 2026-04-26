-- Migration: incluir duración total y servicios en RPCs del calendario
--
-- Bug: las RPCs `get_dashboard_appointments_safe` y
-- `get_superadmin_calendar_appointments` no devolvían la duración real
-- de cada cita ni la lista de servicios adicionales. El calendario
-- (StylistCalendarView) renderizaba todas las citas como un solo cuadrito
-- de 1 hora, sin importar si la cita real duraba 30, 90 o 180 minutos.
--
-- Fix: ambas RPCs ahora exponen `duration_minutes` (servicio primario +
-- SUMA de duraciones de `appointment_services`) y `service_names`
-- (array con todos los nombres de servicios de la cita, primario primero).
-- Mismo patrón usado en la migración 20260426_get_busy_slots_total_duration.

-- ── get_dashboard_appointments_safe ──
DROP FUNCTION IF EXISTS public.get_dashboard_appointments_safe();
CREATE OR REPLACE FUNCTION public.get_dashboard_appointments_safe()
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_name text,
  service_id uuid,
  service_name text,
  service_price numeric,
  service_names text[],
  duration_minutes int,
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
    -- Primario primero, luego adicionales en orden de inserción.
    ARRAY[COALESCE(s.name, 'Servicio')]
      || COALESCE(extras.names, ARRAY[]::text[]) AS service_names,
    (COALESCE(s.duration_minutes, 30) + COALESCE(extras.extra_minutes, 0))::int
      AS duration_minutes,
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
  LEFT JOIN (
    SELECT
      aps.appointment_id,
      SUM(svc.duration_minutes)::int AS extra_minutes,
      ARRAY_AGG(svc.name ORDER BY aps.created_at NULLS LAST, svc.name) AS names
    FROM public.appointment_services aps
    JOIN public.services svc ON svc.id = aps.service_id
    GROUP BY aps.appointment_id
  ) extras ON extras.appointment_id = a.id
  WHERE
    (v_role = 'superadmin')
    OR (v_role IN ('admin', 'stylist') AND a.salon_id = v_salon_id)
    OR (v_role = 'client' AND a.client_id = v_uid)
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── get_superadmin_calendar_appointments ──
DROP FUNCTION IF EXISTS public.get_superadmin_calendar_appointments();
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
  ready_for_billing boolean,
  ready_for_billing_at timestamp with time zone,
  ready_for_billing_by uuid,
  canceled_at timestamp with time zone,
  canceled_by uuid,
  notes text,
  salon_id uuid,
  service_name text,
  service_price numeric,
  service_names text[],
  duration_minutes int,
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
    a.ready_for_billing,
    a.ready_for_billing_at,
    a.ready_for_billing_by,
    a.canceled_at,
    a.canceled_by,
    a.notes,
    a.salon_id,
    s.name AS service_name,
    s.price AS service_price,
    ARRAY[COALESCE(s.name, 'Servicio')]
      || COALESCE(extras.names, ARRAY[]::text[]) AS service_names,
    (COALESCE(s.duration_minutes, 30) + COALESCE(extras.extra_minutes, 0))::int
      AS duration_minutes,
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
  LEFT JOIN (
    SELECT
      aps.appointment_id,
      SUM(svc.duration_minutes)::int AS extra_minutes,
      ARRAY_AGG(svc.name ORDER BY aps.created_at NULLS LAST, svc.name) AS names
    FROM public.appointment_services aps
    JOIN public.services svc ON svc.id = aps.service_id
    GROUP BY aps.appointment_id
  ) extras ON extras.appointment_id = a.id
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
