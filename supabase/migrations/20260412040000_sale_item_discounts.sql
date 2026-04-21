-- Descuentos por ítem en ventas (porcentaje y valor)
-- para reflejarlos en cálculo de total e informes.

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

UPDATE public.sale_items
SET
  discount_percentage = COALESCE(discount_percentage, 0),
  discount_amount = COALESCE(discount_amount, 0);

ALTER TABLE public.sale_items
  ALTER COLUMN discount_percentage SET NOT NULL,
  ALTER COLUMN discount_amount SET NOT NULL;

ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_discount_percentage_check;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_discount_percentage_check
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_discount_amount_check;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_discount_amount_check
  CHECK (discount_amount >= 0);

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
      UPDATE public.appointments
      SET status = 'completada', is_paid = true, payment_method = p_payment_method
      WHERE id = (v_item.value->>'appointment_id')::uuid
        AND salon_id = v_resolved_salon_id;
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
