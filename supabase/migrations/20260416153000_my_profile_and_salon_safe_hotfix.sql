-- Hotfix: evitar recursión y campos en blanco en "Mi Perfil".
-- 1) get_my_salon_id sin dependencia de public.profiles
-- 2) get_my_profile_safe para lectura directa del propio perfil.

CREATE OR REPLACE FUNCTION public.get_my_salon_id()
RETURNS uuid AS $$
DECLARE
  v_salon_id uuid;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ? 'salon_id') THEN
    v_salon_id := NULLIF(auth.jwt() -> 'app_metadata' ->> 'salon_id', '')::uuid;
    RETURN v_salon_id;
  END IF;

  SELECT NULLIF(u.raw_app_meta_data ->> 'salon_id', '')::uuid
  INTO v_salon_id
  FROM auth.users u
  WHERE u.id = auth.uid();

  RETURN v_salon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

CREATE OR REPLACE FUNCTION public.get_my_profile_safe()
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
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
  WHERE p.id = auth.uid()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
