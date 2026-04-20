-- Auditoría de cancelación de citas (fecha/hora y usuario)

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS canceled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.mark_appointment_cancelled(p_appointment_id uuid)
RETURNS void AS $$
DECLARE
  v_role text;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  v_role := public.get_my_role();
  IF v_role NOT IN ('client', 'stylist', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para cancelar citas.';
  END IF;

  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_appointment.id IS NULL THEN
    RAISE EXCEPTION 'La cita no existe.';
  END IF;

  IF v_appointment.is_paid THEN
    RAISE EXCEPTION 'No se puede cancelar una cita ya pagada.';
  END IF;

  IF v_appointment.status = 'cancelada' THEN
    RAISE EXCEPTION 'La cita ya está cancelada.';
  END IF;

  IF v_role = 'client' THEN
    IF v_appointment.client_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Solo puedes cancelar tus propias citas.';
    END IF;
    IF v_appointment.appointment_date <= (now() + interval '24 hours') THEN
      RAISE EXCEPTION 'Solo puedes cancelar con más de 24 horas de anticipación.';
    END IF;
  ELSIF v_role = 'stylist' THEN
    IF v_appointment.stylist_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Solo puedes cancelar citas asignadas a ti.';
    END IF;
  ELSIF v_role = 'admin' THEN
    IF v_appointment.salon_id IS DISTINCT FROM public.get_my_salon_id() THEN
      RAISE EXCEPTION 'Solo puedes cancelar citas de tu salón.';
    END IF;
  END IF;

  UPDATE public.appointments
  SET
    status = 'cancelada',
    ready_for_billing = false,
    ready_for_billing_at = null,
    ready_for_billing_by = null,
    canceled_at = now(),
    canceled_by = auth.uid()
  WHERE id = p_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
