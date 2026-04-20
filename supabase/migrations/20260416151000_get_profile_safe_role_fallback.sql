-- Permite leer el propio perfil aunque role esté nulo en profiles.
-- Evita caer en fallback vacío cuando sí existe información.

CREATE OR REPLACE FUNCTION public.get_profile_safe(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  first_name text,
  second_name text,
  last_name text,
  second_last_name text,
  document_id text,
  birth_date date,
  gender text,
  email text,
  phone text,
  address text,
  department text,
  city text,
  is_available boolean,
  break_start_time time,
  break_end_time time,
  blood_type text,
  medical_conditions text,
  allergies text,
  medical_form_requested boolean,
  role text,
  specialty text,
  avatar_url text,
  salon_id uuid,
  status text,
  terminated_at timestamp with time zone,
  created_at timestamp with time zone,
  work_start_time time,
  work_end_time time
) AS $$
DECLARE
  v_target uuid;
  v_my_role text;
  v_my_salon uuid;
  v_target_salon uuid;
BEGIN
  v_target := COALESCE(p_user_id, auth.uid());
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT p.role, p.salon_id
  INTO v_my_role, v_my_salon
  FROM public.profiles p
  WHERE p.id = auth.uid();

  v_my_role := COALESCE(v_my_role, public.get_my_role(), 'client');

  IF v_target <> auth.uid() THEN
    IF v_my_role NOT IN ('admin', 'superadmin') THEN
      RAISE EXCEPTION 'No autorizado para consultar otros perfiles';
    END IF;

    IF v_my_role = 'admin' THEN
      SELECT p.salon_id INTO v_target_salon
      FROM public.profiles p
      WHERE p.id = v_target;

      IF v_target_salon IS DISTINCT FROM v_my_salon THEN
        RAISE EXCEPTION 'No autorizado para consultar perfiles de otro salón';
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.first_name,
    p.second_name,
    p.last_name,
    p.second_last_name,
    p.document_id,
    p.birth_date,
    p.gender,
    p.email,
    p.phone,
    p.address,
    p.department,
    p.city,
    p.is_available,
    p.break_start_time,
    p.break_end_time,
    p.blood_type,
    p.medical_conditions,
    p.allergies,
    p.medical_form_requested,
    p.role,
    p.specialty,
    p.avatar_url,
    p.salon_id,
    p.status,
    p.terminated_at,
    p.created_at,
    p.work_start_time,
    p.work_end_time
  FROM public.profiles p
  WHERE p.id = v_target
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
