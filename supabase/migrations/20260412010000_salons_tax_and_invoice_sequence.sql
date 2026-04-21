-- Régimen tributario por salón + consecutivo de facturación por salón

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS regimen_tributario text DEFAULT 'no_responsable_iva',
  ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'FV',
  ADD COLUMN IF NOT EXISTS invoice_next_number bigint DEFAULT 1;

UPDATE public.salons
SET
  regimen_tributario = COALESCE(regimen_tributario, 'no_responsable_iva'),
  invoice_prefix = COALESCE(NULLIF(invoice_prefix, ''), 'FV'),
  invoice_next_number = COALESCE(NULLIF(invoice_next_number, 0), 1);

ALTER TABLE public.salons
  ALTER COLUMN regimen_tributario SET NOT NULL,
  ALTER COLUMN invoice_prefix SET NOT NULL,
  ALTER COLUMN invoice_next_number SET NOT NULL;

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_regimen_tributario_check;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_regimen_tributario_check
  CHECK (regimen_tributario IN ('responsable_iva', 'no_responsable_iva', 'simple'));

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_invoice_next_number_check;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_invoice_next_number_check
  CHECK (invoice_next_number >= 1);

ALTER TABLE public.product_sales
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_sales_salon_invoice_number_unique
  ON public.product_sales (salon_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_salon_id uuid)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
BEGIN
  UPDATE public.salons
  SET invoice_next_number = invoice_next_number + 1
  WHERE id = p_salon_id
  RETURNING COALESCE(NULLIF(invoice_prefix, ''), 'FV'), (invoice_next_number - 1)
  INTO v_prefix, v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'No se pudo generar consecutivo de factura para el salón %', p_salon_id;
  END IF;

  RETURN upper(v_prefix) || '-' || lpad(v_seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_resolved_salon_id uuid;
  v_invoice_number text;
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

  v_invoice_number := public.generate_invoice_number(v_resolved_salon_id);

  INSERT INTO public.product_sales (client_id, seller_id, total_amount, payment_method, salon_id, invoice_number)
  VALUES (p_client_id, p_seller_id, 0, p_payment_method, v_resolved_salon_id, v_invoice_number)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_unit_price := (v_item.value->>'unit_price')::numeric;
    v_total := v_total + (v_unit_price * (v_item.value->>'quantity')::integer);

    IF v_item.value->>'product_id' IS NOT NULL THEN
      SELECT id, stock INTO v_product FROM public.products
      WHERE id = (v_item.value->>'product_id')::uuid
        AND is_active = true
        AND salon_id = v_resolved_salon_id
      FOR UPDATE;

      IF v_product IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', v_item.value->>'product_id';
      END IF;

      IF v_product.stock < (v_item.value->>'quantity')::integer THEN
        RAISE EXCEPTION 'Stock insuficiente para producto: %', v_product.id;
      END IF;

      UPDATE public.products
      SET stock = stock - (v_item.value->>'quantity')::integer
      WHERE id = v_product.id;
    END IF;

    IF v_item.value->>'appointment_id' IS NOT NULL THEN
      UPDATE public.appointments
      SET status = 'completada', is_paid = true, payment_method = p_payment_method
      WHERE id = (v_item.value->>'appointment_id')::uuid
        AND salon_id = v_resolved_salon_id;
    END IF;

    INSERT INTO public.sale_items (
      sale_id, product_id, service_id, appointment_id, quantity, unit_price
    )
    VALUES (
      v_sale_id,
      (v_item.value->>'product_id')::uuid,
      (v_item.value->>'service_id')::uuid,
      (v_item.value->>'appointment_id')::uuid,
      (v_item.value->>'quantity')::integer,
      v_unit_price
    );
  END LOOP;

  UPDATE public.product_sales SET total_amount = v_total WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
