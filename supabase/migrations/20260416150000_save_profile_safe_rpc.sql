-- Guardado seguro de perfiles por RPC para evitar fallos RLS/recursión.

CREATE OR REPLACE FUNCTION public.save_profile_safe(
  p_profile_id uuid,
  p_payload jsonb
)
RETURNS uuid AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_salon uuid;
  v_target_salon uuid;
  v_exists boolean;
  v_saved_id uuid;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT p.role, p.salon_id
  INTO v_actor_role, v_actor_salon
  FROM public.profiles p
  WHERE p.id = v_actor_id;

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil sin id';
  END IF;

  IF p_profile_id <> v_actor_id THEN
    IF v_actor_role NOT IN ('admin', 'superadmin') THEN
      RAISE EXCEPTION 'No autorizado para actualizar otros perfiles';
    END IF;

    IF v_actor_role = 'admin' THEN
      SELECT p.salon_id INTO v_target_salon
      FROM public.profiles p
      WHERE p.id = p_profile_id;
      IF v_target_salon IS DISTINCT FROM v_actor_salon THEN
        RAISE EXCEPTION 'No autorizado para actualizar perfiles de otro salón';
      END IF;
    END IF;
  END IF;

  IF v_actor_role = 'admin' AND (p_payload ? 'role') AND (p_payload->>'role') = 'superadmin' THEN
    RAISE EXCEPTION 'Un admin no puede asignar rol superadmin';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = p_profile_id) INTO v_exists;

  IF v_exists THEN
    UPDATE public.profiles p
    SET
      full_name = CASE WHEN p_payload ? 'full_name' THEN (p_payload->>'full_name') ELSE p.full_name END,
      first_name = CASE WHEN p_payload ? 'first_name' THEN (p_payload->>'first_name') ELSE p.first_name END,
      second_name = CASE WHEN p_payload ? 'second_name' THEN (p_payload->>'second_name') ELSE p.second_name END,
      last_name = CASE WHEN p_payload ? 'last_name' THEN (p_payload->>'last_name') ELSE p.last_name END,
      second_last_name = CASE WHEN p_payload ? 'second_last_name' THEN (p_payload->>'second_last_name') ELSE p.second_last_name END,
      document_id = CASE WHEN p_payload ? 'document_id' THEN (p_payload->>'document_id') ELSE p.document_id END,
      birth_date = CASE WHEN p_payload ? 'birth_date' THEN (p_payload->>'birth_date')::date ELSE p.birth_date END,
      gender = CASE WHEN p_payload ? 'gender' THEN (p_payload->>'gender') ELSE p.gender END,
      phone = CASE WHEN p_payload ? 'phone' THEN (p_payload->>'phone') ELSE p.phone END,
      address = CASE WHEN p_payload ? 'address' THEN (p_payload->>'address') ELSE p.address END,
      department = CASE WHEN p_payload ? 'department' THEN (p_payload->>'department') ELSE p.department END,
      city = CASE WHEN p_payload ? 'city' THEN (p_payload->>'city') ELSE p.city END,
      is_available = CASE WHEN p_payload ? 'is_available' THEN (p_payload->>'is_available')::boolean ELSE p.is_available END,
      break_start_time = CASE WHEN p_payload ? 'break_start_time' THEN (p_payload->>'break_start_time')::time ELSE p.break_start_time END,
      break_end_time = CASE WHEN p_payload ? 'break_end_time' THEN (p_payload->>'break_end_time')::time ELSE p.break_end_time END,
      status = CASE WHEN p_payload ? 'status' THEN (p_payload->>'status') ELSE p.status END,
      terminated_at = CASE WHEN p_payload ? 'terminated_at' THEN (p_payload->>'terminated_at')::timestamptz ELSE p.terminated_at END,
      blood_type = CASE WHEN p_payload ? 'blood_type' THEN (p_payload->>'blood_type') ELSE p.blood_type END,
      medical_conditions = CASE WHEN p_payload ? 'medical_conditions' THEN (p_payload->>'medical_conditions') ELSE p.medical_conditions END,
      allergies = CASE WHEN p_payload ? 'allergies' THEN (p_payload->>'allergies') ELSE p.allergies END,
      medical_form_requested = CASE WHEN p_payload ? 'medical_form_requested' THEN (p_payload->>'medical_form_requested')::boolean ELSE p.medical_form_requested END,
      role = CASE WHEN p_payload ? 'role' THEN (p_payload->>'role') ELSE p.role END,
      specialty = CASE WHEN p_payload ? 'specialty' THEN (p_payload->>'specialty') ELSE p.specialty END,
      avatar_url = CASE WHEN p_payload ? 'avatar_url' THEN (p_payload->>'avatar_url') ELSE p.avatar_url END,
      salon_id = CASE WHEN p_payload ? 'salon_id' THEN NULLIF(p_payload->>'salon_id','')::uuid ELSE p.salon_id END,
      work_start_time = CASE WHEN p_payload ? 'work_start_time' THEN (p_payload->>'work_start_time')::time ELSE p.work_start_time END,
      work_end_time = CASE WHEN p_payload ? 'work_end_time' THEN (p_payload->>'work_end_time')::time ELSE p.work_end_time END
    WHERE p.id = p_profile_id
    RETURNING p.id INTO v_saved_id;
  ELSE
    INSERT INTO public.profiles (
      id, full_name, email, role, salon_id
    ) VALUES (
      p_profile_id,
      COALESCE(p_payload->>'full_name', 'Usuario'),
      COALESCE(p_payload->>'email', ''),
      COALESCE(p_payload->>'role', 'client'),
      NULLIF(p_payload->>'salon_id','')::uuid
    )
    RETURNING id INTO v_saved_id;
  END IF;

  RETURN v_saved_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
