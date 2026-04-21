-- Autorización de facturación por cita
-- Solo citas marcadas como servicio realizado a satisfacción podrán pasar a POS/facturación.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS ready_for_billing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_for_billing_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ready_for_billing_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.appointments
SET ready_for_billing = COALESCE(ready_for_billing, false)
WHERE ready_for_billing IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN ready_for_billing SET NOT NULL;

CREATE OR REPLACE FUNCTION public.mark_appointment_ready_for_billing(p_appointment_id uuid)
RETURNS void AS $$
DECLARE
  v_role text;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  v_role := public.get_my_role();
  IF v_role NOT IN ('stylist', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para autorizar facturación.';
  END IF;

  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_appointment.id IS NULL THEN
    RAISE EXCEPTION 'La cita no existe.';
  END IF;

  IF v_appointment.status = 'cancelada' THEN
    RAISE EXCEPTION 'No se puede autorizar una cita cancelada.';
  END IF;

  IF v_appointment.is_paid THEN
    RAISE EXCEPTION 'La cita ya está pagada.';
  END IF;

  IF v_role = 'stylist' AND v_appointment.stylist_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Solo puedes autorizar tus propias citas.';
  END IF;

  IF v_role = 'admin' AND v_appointment.salon_id IS DISTINCT FROM public.get_my_salon_id() THEN
    RAISE EXCEPTION 'Solo puedes autorizar citas de tu salón.';
  END IF;

  UPDATE public.appointments
  SET
    status = 'completada',
    ready_for_billing = true,
    ready_for_billing_at = now(),
    ready_for_billing_by = auth.uid()
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

CREATE OR REPLACE FUNCTION process_sale(
  p_client_id uuid,
  p_seller_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_salon_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_sale_id uuid;
  v_total numeric := 0;
  v_item record;
  v_product record;
  v_unit_price numeric;
  v_quantity integer;
  v_line_base numeric;
  v_discount_percentage numeric(5,2);
  v_discount_amount numeric;
  v_line_vat numeric;
  v_line_total numeric;
  v_tax_treatment text;
  v_applies_vat boolean;
  v_vat_percentage numeric(5,2);
  v_resolved_salon_id uuid;
  v_invoice_number text;
  v_authorized_appointment_id uuid;
BEGIN
  IF p_salon_id IS NOT NULL THEN
    v_resolved_salon_id := p_salon_id;
  ELSE
    SELECT salon_id INTO v_resolved_salon_id
    FROM public.profiles WHERE id = p_seller_id;
  END IF;

  IF v_resolved_salon_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo determinar el salón para la venta.';
  END IF;

  SELECT applies_vat, COALESCE(vat_percentage, 0)
  INTO v_applies_vat, v_vat_percentage
  FROM public.salons
  WHERE id = v_resolved_salon_id;

  v_invoice_number := public.generate_invoice_number(v_resolved_salon_id);

  INSERT INTO public.product_sales (client_id, seller_id, total_amount, payment_method, salon_id, invoice_number)
  VALUES (p_client_id, p_seller_id, 0, p_payment_method, v_resolved_salon_id, v_invoice_number)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_unit_price := (v_item.value->>'unit_price')::numeric;
    v_quantity := (v_item.value->>'quantity')::integer;
    v_discount_percentage := COALESCE((v_item.value->>'discount_percentage')::numeric, 0);
    IF v_discount_percentage < 0 OR v_discount_percentage > 100 THEN
      RAISE EXCEPTION 'Descuento inválido (%). Debe estar entre 0 y 100.', v_discount_percentage;
    END IF;
    v_tax_treatment := COALESCE(v_item.value->>'tax_treatment', 'gravado');
    v_line_base := v_unit_price * v_quantity;
    v_discount_amount := round(v_line_base * (v_discount_percentage / 100), 2);
    v_line_base := v_line_base - v_discount_amount;
    v_line_vat := 0;
    IF v_applies_vat AND v_tax_treatment = 'gravado' THEN
      v_line_vat := round(v_line_base * (v_vat_percentage / 100), 2);
    END IF;
    v_line_total := v_line_base + v_line_vat;
    v_total := v_total + v_line_total;

    IF v_item.value->>'product_id' IS NOT NULL THEN
      SELECT id, stock INTO v_product FROM public.products
      WHERE id = (v_item.value->>'product_id')::uuid
        AND is_active = true
        AND salon_id = v_resolved_salon_id
      FOR UPDATE;

      IF v_product IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', v_item.value->>'product_id';
      END IF;

      IF v_product.stock < v_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para producto: %', v_product.id;
      END IF;

      UPDATE public.products
      SET stock = stock - v_quantity
      WHERE id = v_product.id;
    END IF;

    IF v_item.value->>'appointment_id' IS NOT NULL THEN
      v_authorized_appointment_id := NULL;
      UPDATE public.appointments
      SET status = 'completada', is_paid = true, payment_method = p_payment_method
      WHERE id = (v_item.value->>'appointment_id')::uuid
        AND salon_id = v_resolved_salon_id
        AND ready_for_billing = true
        AND status <> 'cancelada'
      RETURNING id INTO v_authorized_appointment_id;

      IF v_authorized_appointment_id IS NULL THEN
        RAISE EXCEPTION 'La cita % no está autorizada para facturación.', v_item.value->>'appointment_id';
      END IF;
    END IF;

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      service_id,
      appointment_id,
      quantity,
      unit_price,
      discount_percentage,
      discount_amount,
      tax_treatment,
      vat_rate,
      vat_amount,
      line_total
    )
    VALUES (
      v_sale_id,
      (v_item.value->>'product_id')::uuid,
      (v_item.value->>'service_id')::uuid,
      (v_item.value->>'appointment_id')::uuid,
      v_quantity,
      v_unit_price,
      v_discount_percentage,
      v_discount_amount,
      v_tax_treatment,
      CASE WHEN v_applies_vat AND v_tax_treatment = 'gravado' THEN v_vat_percentage ELSE 0 END,
      v_line_vat,
      v_line_total
    );
  END LOOP;

  UPDATE public.product_sales SET total_amount = v_total WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
