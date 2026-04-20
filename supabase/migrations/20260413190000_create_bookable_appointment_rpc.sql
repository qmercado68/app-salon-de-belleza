-- Crea cita vía RPC SECURITY DEFINER para evitar bloqueos/recursión RLS en appointments.

CREATE OR REPLACE FUNCTION public.create_bookable_appointment(
  p_client_id uuid,
  p_service_id uuid,
  p_stylist_id uuid DEFAULT NULL,
  p_appointment_date timestamp with time zone DEFAULT now(),
  p_status text DEFAULT 'pendiente',
  p_payment_method text DEFAULT 'efectivo',
  p_notes text DEFAULT NULL,
  p_salon_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
  v_target_salon uuid;
  v_appointment_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para reservar.';
  END IF;

  v_role := public.get_my_role();
  v_my_salon := public.get_my_salon_id();
  v_target_salon := COALESCE(p_salon_id, v_my_salon);

  IF v_role = 'superadmin' AND p_salon_id IS NULL THEN
    RAISE EXCEPTION 'Selecciona un salón para reservar la cita.';
  END IF;

  IF v_target_salon IS NULL THEN
    RAISE EXCEPTION 'No se pudo determinar el salón de la cita.';
  END IF;

  IF v_role = 'client' AND p_client_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No puedes reservar citas para otro cliente.';
  END IF;

  IF v_role IN ('admin', 'stylist') AND v_my_salon IS NOT NULL AND v_target_salon IS DISTINCT FROM v_my_salon THEN
    RAISE EXCEPTION 'Solo puedes reservar citas dentro de tu salón.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.services s
    WHERE s.id = p_service_id
      AND s.is_active = true
      AND (s.salon_id = v_target_salon OR s.salon_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'El servicio no está disponible para el salón seleccionado.';
  END IF;

  IF p_stylist_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_stylist_id
      AND p.role = 'stylist'
      AND COALESCE(p.status, 'active') <> 'terminated'
      AND (p.salon_id = v_target_salon OR p.salon_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'El estilista no está disponible para el salón seleccionado.';
  END IF;

  INSERT INTO public.appointments (
    client_id,
    service_id,
    stylist_id,
    appointment_date,
    status,
    is_paid,
    ready_for_billing,
    ready_for_billing_at,
    ready_for_billing_by,
    payment_method,
    notes,
    salon_id
  )
  VALUES (
    p_client_id,
    p_service_id,
    p_stylist_id,
    p_appointment_date,
    COALESCE(p_status, 'pendiente'),
    false,
    false,
    NULL,
    NULL,
    COALESCE(p_payment_method, 'efectivo'),
    p_notes,
    v_target_salon
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
