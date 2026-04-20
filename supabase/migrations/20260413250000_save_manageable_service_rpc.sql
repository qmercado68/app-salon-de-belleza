-- Guardado de servicios por RPC (admin/superadmin) para evitar fallos por RLS/políticas.

CREATE OR REPLACE FUNCTION public.save_manageable_service(
  p_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_duration_minutes integer DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_tax_treatment text DEFAULT 'gravado',
  p_image_url text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_salon_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
  v_target_salon uuid;
  v_saved_id uuid;
  v_existing_salon uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_my_salon
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para gestionar servicios.';
  END IF;

  v_target_salon := p_salon_id;
  IF v_role = 'admin' THEN
    IF v_my_salon IS NULL THEN
      RAISE EXCEPTION 'Tu usuario admin no tiene salón asignado.';
    END IF;
    IF v_target_salon IS NULL THEN
      v_target_salon := v_my_salon;
    ELSIF v_target_salon IS DISTINCT FROM v_my_salon THEN
      RAISE EXCEPTION 'Solo puedes gestionar servicios de tu salón.';
    END IF;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.services (
      name, description, duration_minutes, price, category, tax_treatment, image_url, is_active, salon_id
    )
    VALUES (
      p_name,
      p_description,
      p_duration_minutes,
      p_price,
      p_category,
      COALESCE(p_tax_treatment, 'gravado'),
      p_image_url,
      COALESCE(p_is_active, true),
      v_target_salon
    )
    RETURNING id INTO v_saved_id;
  ELSE
    IF v_role = 'admin' THEN
      SELECT s.salon_id INTO v_existing_salon
      FROM public.services s
      WHERE s.id = p_id;

      IF v_existing_salon IS DISTINCT FROM v_my_salon THEN
        RAISE EXCEPTION 'No puedes editar servicios de otro salón.';
      END IF;
    END IF;

    UPDATE public.services
    SET
      name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
      price = COALESCE(p_price, price),
      category = COALESCE(p_category, category),
      tax_treatment = COALESCE(p_tax_treatment, tax_treatment),
      image_url = CASE WHEN p_image_url IS NULL THEN image_url ELSE p_image_url END,
      is_active = COALESCE(p_is_active, is_active),
      salon_id = COALESCE(v_target_salon, salon_id)
    WHERE id = p_id
    RETURNING id INTO v_saved_id;
  END IF;

  IF v_saved_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo guardar el servicio.';
  END IF;

  RETURN v_saved_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
