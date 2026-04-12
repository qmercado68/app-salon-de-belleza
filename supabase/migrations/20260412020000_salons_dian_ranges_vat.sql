-- Campos DIAN y % IVA por salón

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS dian_resolution text,
  ADD COLUMN IF NOT EXISTS invoice_range_from bigint DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invoice_range_to bigint,
  ADD COLUMN IF NOT EXISTS invoice_valid_until date,
  ADD COLUMN IF NOT EXISTS applies_vat boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_percentage numeric(5,2) DEFAULT 0;

UPDATE public.salons
SET
  invoice_range_from = COALESCE(NULLIF(invoice_range_from, 0), 1),
  applies_vat = COALESCE(applies_vat, false),
  vat_percentage = COALESCE(vat_percentage, 0);

ALTER TABLE public.salons
  ALTER COLUMN invoice_range_from SET NOT NULL,
  ALTER COLUMN applies_vat SET NOT NULL,
  ALTER COLUMN vat_percentage SET NOT NULL;

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_invoice_range_from_check;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_invoice_range_from_check
  CHECK (invoice_range_from >= 1);

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_invoice_range_to_check;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_invoice_range_to_check
  CHECK (invoice_range_to IS NULL OR invoice_range_to >= invoice_range_from);

ALTER TABLE public.salons
  DROP CONSTRAINT IF EXISTS salons_vat_percentage_check;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_vat_percentage_check
  CHECK (vat_percentage >= 0 AND vat_percentage <= 100);

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_salon_id uuid)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
  v_range_from bigint;
  v_range_to bigint;
  v_valid_until date;
BEGIN
  SELECT
    COALESCE(NULLIF(invoice_prefix, ''), 'FV'),
    invoice_next_number,
    COALESCE(invoice_range_from, 1),
    invoice_range_to,
    invoice_valid_until
  INTO v_prefix, v_seq, v_range_from, v_range_to, v_valid_until
  FROM public.salons
  WHERE id = p_salon_id
  FOR UPDATE;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'No se pudo generar consecutivo de factura para el salón %', p_salon_id;
  END IF;

  IF v_valid_until IS NOT NULL AND v_valid_until < current_date THEN
    RAISE EXCEPTION 'La vigencia de facturación del salón % está vencida (%).', p_salon_id, v_valid_until;
  END IF;

  IF v_seq < v_range_from THEN
    v_seq := v_range_from;
  END IF;

  IF v_range_to IS NOT NULL AND v_seq > v_range_to THEN
    RAISE EXCEPTION 'El consecutivo % excede el rango autorizado hasta % para el salón %.', v_seq, v_range_to, p_salon_id;
  END IF;

  UPDATE public.salons
  SET invoice_next_number = v_seq + 1
  WHERE id = p_salon_id;

  RETURN upper(v_prefix) || '-' || lpad(v_seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
