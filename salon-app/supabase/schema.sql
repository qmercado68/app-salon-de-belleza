-- ==========================================
-- App de Gestión para Salón de Belleza
-- Esquema de Base de Datos (Supabase / PostgreSQL)
-- Arquitectura Multi-Empresa (SaaS) - Opción B: clientes aislados por salón
-- ==========================================

-- Habilitar la extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. TABLA RAÍZ: salons
CREATE TABLE IF NOT EXISTS public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  regimen_tributario text NOT NULL DEFAULT 'no_responsable_iva' CHECK (regimen_tributario IN ('responsable_iva', 'no_responsable_iva', 'simple')),
  dian_resolution text,
  invoice_prefix text NOT NULL DEFAULT 'FV',
  invoice_range_from bigint NOT NULL DEFAULT 1 CHECK (invoice_range_from >= 1),
  invoice_range_to bigint CHECK (invoice_range_to IS NULL OR invoice_range_to >= invoice_range_from),
  invoice_valid_until date,
  applies_vat boolean NOT NULL DEFAULT false,
  vat_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_percentage >= 0 AND vat_percentage <= 100),
  invoice_next_number bigint NOT NULL DEFAULT 1 CHECK (invoice_next_number >= 1),
  address text,
  phone text,
  email text,
  logo_url text,
  theme_color text DEFAULT '#ec4899',
  is_active boolean DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Políticas para SALONES
DROP POLICY IF EXISTS "Salones visibles para todos" ON public.salons;
CREATE POLICY "Salones visibles para todos" 
  ON public.salons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo superadmins pueden gestionar salones" ON public.salons;
CREATE POLICY "Solo superadmins pueden gestionar salones" 
  ON public.salons FOR ALL USING (
    get_my_role() = 'superadmin'
  );

-- 1. TABLA DE PERFILES (Extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  email text, -- Sincronizado desde auth.users
  document_id text,
  birth_date date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  phone text,
  address text,
  blood_type varchar(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  medical_conditions text,
  allergies text,
  medical_form_requested boolean DEFAULT false,
  salon_id uuid REFERENCES public.salons(id) ON DELETE SET NULL,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin', 'stylist', 'superadmin')),
  specialty text,
  avatar_url text,
  work_start_time time DEFAULT '09:00:00',
  work_end_time time DEFAULT '18:00:00',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DE SERVICIOS
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  tax_treatment text NOT NULL DEFAULT 'gravado' CHECK (tax_treatment IN ('gravado', 'exento', 'excluido')),
  image_url text,
  is_active boolean DEFAULT true,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE CITAS
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  stylist_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_date timestamp with time zone NOT NULL,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  payment_method text DEFAULT 'efectivo',
  is_paid boolean DEFAULT false,
  ready_for_billing boolean NOT NULL DEFAULT false,
  ready_for_billing_at timestamp with time zone,
  ready_for_billing_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  canceled_at timestamp with time zone,
  canceled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- SEGURIDAD: RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener el rol del usuario actual sin causar recursión en RLS
-- Usamos SECURITY DEFINER para que la consulta a profiles ignore el RLS
-- 1. FUNCIÓN DE ROL SEGURA (NO RECURSIVA)
-- Esta función lee el rol directamente desde el JWT o la tabla de Auth.
-- Al NO consultar la tabla 'profiles', es imposible que genere recursión infinita en RLS.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  -- Opción A: Desde el JWT (Súper rápido)
  IF (auth.jwt() -> 'app_metadata' ? 'role') THEN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'role');
  END IF;

  -- Opción B: Desde la tabla de Auth (Seguro, vía Security Definer)
  -- Usamos SELECT directo a auth.users para evitar tocar public.profiles
  RETURN (SELECT (raw_app_meta_data ->> 'role') FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

CREATE OR REPLACE FUNCTION public.get_my_salon_id()
RETURNS uuid AS $$
DECLARE
  v_salon_id uuid;
BEGIN
  -- Preferir salon_id desde JWT/app_metadata
  IF (auth.jwt() -> 'app_metadata' ? 'salon_id') THEN
    v_salon_id := NULLIF(auth.jwt() -> 'app_metadata' ->> 'salon_id', '')::uuid;
    RETURN v_salon_id;
  END IF;

  -- Fallback seguro: auth.users (evita tocar public.profiles y recursión RLS)
  SELECT NULLIF(u.raw_app_meta_data ->> 'salon_id', '')::uuid
  INTO v_salon_id
  FROM auth.users u
  WHERE u.id = auth.uid();

  RETURN v_salon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Función booleana para verificar staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_my_role() IN ('admin', 'superadmin', 'stylist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas para PERFILES (Resueltas para evitar recursión)
DROP POLICY IF EXISTS "Lectura de perfiles (propios)" ON public.profiles;
DROP POLICY IF EXISTS "Lectura de perfiles (staff)" ON public.profiles;
DROP POLICY IF EXISTS "Lectura propia" ON public.profiles;
DROP POLICY IF EXISTS "Lectura administrativa" ON public.profiles;

CREATE POLICY "Lectura propia" 
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Lectura administrativa" 
  ON public.profiles FOR SELECT USING (public.get_my_role() IN ('admin', 'superadmin'));

DROP POLICY IF EXISTS "profiles_superadmin_all" ON public.profiles;
CREATE POLICY "profiles_superadmin_all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

CREATE POLICY "Lectura de estilistas (pública)" 
  ON public.profiles FOR SELECT USING (role = 'stylist');

DROP POLICY IF EXISTS "Actualización de perfiles (propios)" ON public.profiles;
DROP POLICY IF EXISTS "Actualización de perfiles (staff)" ON public.profiles;
DROP POLICY IF EXISTS "Actualización propia" ON public.profiles;
DROP POLICY IF EXISTS "Actualización administrativa" ON public.profiles;

CREATE POLICY "Actualización propia" 
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Actualización administrativa" 
  ON public.profiles FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));

DROP POLICY IF EXISTS "Inserción de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Inserción libre" ON public.profiles;
CREATE POLICY "Inserción libre"
  ON public.profiles FOR INSERT WITH CHECK (true);

-- Políticas para SERVICIOS
DROP POLICY IF EXISTS "Cualquiera puede ver los servicios activos" ON public.services;
CREATE POLICY "Cualquiera puede ver los servicios activos" 
  ON public.services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Solo administradores pueden gestionar servicios" ON public.services;
CREATE POLICY "Solo administradores pueden gestionar servicios" 
  ON public.services FOR ALL USING (
    get_my_role() IN ('admin', 'superadmin')
  );

-- Políticas para CITAS
DROP POLICY IF EXISTS "Los clientes pueden ver sus propias citas" ON public.appointments;
CREATE POLICY "Los clientes pueden ver sus propias citas" 
  ON public.appointments FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Los clientes pueden crear sus propias citas" ON public.appointments;
CREATE POLICY "Los clientes pueden crear sus propias citas" 
  ON public.appointments FOR INSERT WITH CHECK (
    auth.uid() = client_id OR 
    get_my_role() IN ('admin', 'stylist', 'superadmin')
  );

DROP POLICY IF EXISTS "Los clientes pueden cancelar sus citas (si faltan > 24h)" ON public.appointments;
CREATE POLICY "Los clientes pueden cancelar sus citas (si faltan > 24h)" 
  ON public.appointments FOR UPDATE USING (
    (auth.uid() = client_id AND status = 'pendiente' AND appointment_date > (now() + interval '24 hours')) OR
    get_my_role() IN ('admin', 'stylist', 'superadmin')
  );

DROP POLICY IF EXISTS "Staff puede ver todas las citas" ON public.appointments;
CREATE POLICY "Staff puede ver todas las citas" 
  ON public.appointments FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "Staff puede gestionar estados y pagos" ON public.appointments;
CREATE POLICY "Staff puede gestionar estados y pagos" 
  ON public.appointments FOR UPDATE USING (is_staff());

DROP POLICY IF EXISTS "appointments_superadmin_all" ON public.appointments;
CREATE POLICY "appointments_superadmin_all"
  ON public.appointments FOR ALL
  USING (public.get_my_role() = 'superadmin')
  WITH CHECK (public.get_my_role() = 'superadmin');

-- Función para que los clientes consulten disponibilidad de un estilista sin ver detalles de citas ajenas
CREATE OR REPLACE FUNCTION public.get_busy_slots(p_stylist_id uuid, p_date date)
RETURNS TABLE (appointment_date timestamp with time zone, duration_minutes int) AS $$
BEGIN
  RETURN QUERY
  SELECT a.appointment_date, s.duration_minutes
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  WHERE a.stylist_id = p_stylist_id
    AND a.appointment_date::date = p_date
    AND a.status != 'cancelada';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION public.get_superadmin_bookable_clients(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  avatar_url text,
  salon_id uuid,
  status text,
  created_at timestamp with time zone
) AS $$
BEGIN
  IF public.get_my_role() <> 'superadmin' THEN
    RAISE EXCEPTION 'Solo superadmin puede consultar esta función';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.avatar_url,
    p.salon_id,
    p.status,
    p.created_at
  FROM public.profiles p
  WHERE p.role = 'client'
    AND (p_salon_id IS NULL OR p.salon_id = p_salon_id)
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  first_name text,
  second_name text,
  last_name text,
  second_last_name text,
  email text,
  phone text,
  role text,
  status text,
  salon_id uuid,
  created_at timestamp with time zone
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_salon_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para ver el directorio de usuarios.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.first_name,
    p.second_name,
    p.last_name,
    p.second_last_name,
    p.email,
    p.phone,
    p.role,
    COALESCE(p.status, 'active') AS status,
    p.salon_id,
    p.created_at
  FROM public.profiles p
  WHERE
    v_role = 'superadmin'
    OR p.salon_id = v_salon_id
    OR p.id = auth.uid()
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

  v_actor_role := COALESCE(v_actor_role, public.get_my_role(), 'client');

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
      birth_date = CASE WHEN p_payload ? 'birth_date' THEN NULLIF(p_payload->>'birth_date','')::date ELSE p.birth_date END,
      gender = CASE WHEN p_payload ? 'gender' THEN (p_payload->>'gender') ELSE p.gender END,
      phone = CASE WHEN p_payload ? 'phone' THEN (p_payload->>'phone') ELSE p.phone END,
      address = CASE WHEN p_payload ? 'address' THEN (p_payload->>'address') ELSE p.address END,
      department = CASE WHEN p_payload ? 'department' THEN (p_payload->>'department') ELSE p.department END,
      city = CASE WHEN p_payload ? 'city' THEN (p_payload->>'city') ELSE p.city END,
      is_available = CASE WHEN p_payload ? 'is_available' THEN NULLIF(p_payload->>'is_available','')::boolean ELSE p.is_available END,
      break_start_time = CASE WHEN p_payload ? 'break_start_time' THEN NULLIF(p_payload->>'break_start_time','')::time ELSE p.break_start_time END,
      break_end_time = CASE WHEN p_payload ? 'break_end_time' THEN NULLIF(p_payload->>'break_end_time','')::time ELSE p.break_end_time END,
      status = CASE WHEN p_payload ? 'status' THEN (p_payload->>'status') ELSE p.status END,
      terminated_at = CASE WHEN p_payload ? 'terminated_at' THEN NULLIF(p_payload->>'terminated_at','')::timestamptz ELSE p.terminated_at END,
      blood_type = CASE WHEN p_payload ? 'blood_type' THEN (p_payload->>'blood_type') ELSE p.blood_type END,
      medical_conditions = CASE WHEN p_payload ? 'medical_conditions' THEN (p_payload->>'medical_conditions') ELSE p.medical_conditions END,
      allergies = CASE WHEN p_payload ? 'allergies' THEN (p_payload->>'allergies') ELSE p.allergies END,
      medical_form_requested = CASE WHEN p_payload ? 'medical_form_requested' THEN NULLIF(p_payload->>'medical_form_requested','')::boolean ELSE p.medical_form_requested END,
      role = CASE WHEN p_payload ? 'role' THEN (p_payload->>'role') ELSE p.role END,
      specialty = CASE WHEN p_payload ? 'specialty' THEN (p_payload->>'specialty') ELSE p.specialty END,
      avatar_url = CASE WHEN p_payload ? 'avatar_url' THEN (p_payload->>'avatar_url') ELSE p.avatar_url END,
      salon_id = CASE WHEN p_payload ? 'salon_id' THEN NULLIF(p_payload->>'salon_id','')::uuid ELSE p.salon_id END,
      work_start_time = CASE WHEN p_payload ? 'work_start_time' THEN NULLIF(p_payload->>'work_start_time','')::time ELSE p.work_start_time END,
      work_end_time = CASE WHEN p_payload ? 'work_end_time' THEN NULLIF(p_payload->>'work_end_time','')::time ELSE p.work_end_time END
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

CREATE OR REPLACE FUNCTION public.get_ready_for_billing_appointments(p_date date)
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
  service_tax_treatment text,
  client_name text,
  stylist_name text,
  salon_name text
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  v_role := public.get_my_role();
  v_salon_id := public.get_my_salon_id();

  IF v_role NOT IN ('client', 'stylist', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'No tienes permisos para consultar citas de facturación.';
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
    COALESCE(s.tax_treatment, 'gravado') AS service_tax_treatment,
    c.full_name AS client_name,
    st.full_name AS stylist_name,
    sl.name AS salon_name
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  LEFT JOIN public.salons sl ON sl.id = a.salon_id
  WHERE a.appointment_date::date = p_date
    AND a.is_paid = false
    AND a.ready_for_billing = true
    AND a.status <> 'cancelada'
    AND (
      v_role = 'superadmin'
      OR (v_role IN ('admin', 'stylist') AND a.salon_id = v_salon_id)
      OR (v_role = 'client' AND a.client_id = auth.uid())
    )
  ORDER BY a.appointment_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_dashboard_appointments_safe()
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_name text,
  service_id uuid,
  service_name text,
  service_price numeric,
  stylist_id uuid,
  stylist_name text,
  appointment_date timestamp with time zone,
  status text,
  payment_method text,
  is_paid boolean,
  salon_id uuid
) AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_salon_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  v_role := COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT u.raw_app_meta_data ->> 'role' FROM auth.users u WHERE u.id = v_uid),
    'client'
  );

  v_salon_id := COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'salon_id', '')::uuid,
    (SELECT NULLIF(u.raw_app_meta_data ->> 'salon_id', '')::uuid FROM auth.users u WHERE u.id = v_uid),
    (SELECT p.salon_id FROM public.profiles p WHERE p.id = v_uid)
  );

  RETURN QUERY
  SELECT
    a.id,
    a.client_id,
    COALESCE(c.full_name, 'Cliente') AS client_name,
    a.service_id,
    COALESCE(s.name, 'Servicio') AS service_name,
    COALESCE(s.price, 0) AS service_price,
    a.stylist_id,
    COALESCE(st.full_name, 'Sin asignar') AS stylist_name,
    a.appointment_date,
    a.status,
    COALESCE(a.payment_method, 'efectivo') AS payment_method,
    COALESCE(a.is_paid, false) AS is_paid,
    a.salon_id
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  WHERE
    (v_role = 'superadmin')
    OR (v_role IN ('admin', 'stylist') AND a.salon_id = v_salon_id)
    OR (v_role = 'client' AND a.client_id = v_uid)
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.get_stylist_service_report_appointments(date, date, text);
CREATE OR REPLACE FUNCTION public.get_stylist_service_report_appointments(
  p_start_date date,
  p_end_date date,
  p_status text DEFAULT 'todos'
)
RETURNS TABLE (
  appointment_id uuid,
  appointment_date timestamp with time zone,
  completed_at timestamp with time zone,
  paid_at timestamp with time zone,
  appointment_status text,
  is_paid boolean,
  ready_for_billing boolean,
  service_id uuid,
  service_name text,
  service_price numeric,
  stylist_id uuid,
  stylist_name text,
  client_name text,
  invoice_number text,
  discount_percentage numeric,
  discount_amount numeric
) AS $$
DECLARE
  v_role text;
  v_salon_id uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_salon_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'stylist', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para consultar reportes.';
  END IF;

  RETURN QUERY
  SELECT
    a.id AS appointment_id,
    a.appointment_date,
    a.ready_for_billing_at AS completed_at,
    si.paid_at,
    a.status AS appointment_status,
    COALESCE(a.is_paid, false) AS is_paid,
    COALESCE(a.ready_for_billing, false) AS ready_for_billing,
    a.service_id,
    s.name AS service_name,
    s.price AS service_price,
    a.stylist_id,
    COALESCE(st.full_name, 'Sin asignar') AS stylist_name,
    c.full_name AS client_name,
    si.invoice_number,
    COALESCE(si.discount_percentage, 0) AS discount_percentage,
    COALESCE(si.discount_amount, 0) AS discount_amount
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.profiles st ON st.id = a.stylist_id
  LEFT JOIN public.profiles c ON c.id = a.client_id
  LEFT JOIN LATERAL (
    SELECT
      i.discount_percentage,
      i.discount_amount,
      p.invoice_number,
      p.created_at AS paid_at
    FROM public.sale_items i
    LEFT JOIN public.product_sales p ON p.id = i.sale_id
    WHERE i.appointment_id = a.id
    ORDER BY i.created_at DESC NULLS LAST
    LIMIT 1
  ) si ON true
  WHERE a.appointment_date::date BETWEEN p_start_date AND p_end_date
    AND (v_role = 'superadmin' OR a.salon_id = v_salon_id)
    AND (
      p_status = 'todos'
      OR (p_status = 'pagados' AND COALESCE(a.is_paid, false) = true AND a.status <> 'cancelada')
      OR (p_status = 'pendientes_facturar' AND COALESCE(a.ready_for_billing, false) = true AND COALESCE(a.is_paid, false) = false AND a.status <> 'cancelada')
      OR (p_status = 'cancelados' AND a.status = 'cancelada')
    )
  ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_bookable_services(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_minutes integer,
  price numeric,
  category text,
  tax_treatment text,
  image_url text,
  is_active boolean,
  salon_id uuid
) AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
BEGIN
  v_role := public.get_my_role();
  v_my_salon := public.get_my_salon_id();

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.category,
    s.tax_treatment,
    s.image_url,
    s.is_active,
    s.salon_id
  FROM public.services s
  WHERE s.is_active = true
    AND (
      (v_role = 'superadmin' AND (p_salon_id IS NULL OR s.salon_id = p_salon_id OR s.salon_id IS NULL))
      OR (v_role <> 'superadmin' AND (s.salon_id = v_my_salon OR s.salon_id IS NULL))
    )
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_manageable_services(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_minutes integer,
  price numeric,
  category text,
  tax_treatment text,
  image_url text,
  is_active boolean,
  salon_id uuid
) AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
BEGIN
  SELECT p.role, p.salon_id
  INTO v_role, v_my_salon
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'No autorizado para gestionar servicios.';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.category,
    s.tax_treatment,
    s.image_url,
    s.is_active,
    s.salon_id
  FROM public.services s
  WHERE (
    (v_role = 'superadmin' AND (p_salon_id IS NULL OR s.salon_id = p_salon_id OR s.salon_id IS NULL))
    OR (v_role = 'admin' AND (s.salon_id = v_my_salon OR s.salon_id IS NULL))
  )
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.get_bookable_stylists(p_salon_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  specialty text,
  avatar_url text,
  medical_conditions text,
  work_start_time time,
  work_end_time time,
  break_start_time time,
  break_end_time time,
  is_available boolean,
  salon_id uuid,
  status text
) AS $$
DECLARE
  v_role text;
  v_my_salon uuid;
BEGIN
  v_role := public.get_my_role();
  v_my_salon := public.get_my_salon_id();

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.specialty,
    p.avatar_url,
    p.medical_conditions,
    p.work_start_time,
    p.work_end_time,
    p.break_start_time,
    p.break_end_time,
    p.is_available,
    p.salon_id,
    p.status
  FROM public.profiles p
  WHERE p.role = 'stylist'
    AND COALESCE(p.status, 'active') <> 'terminated'
    AND (
      (v_role = 'superadmin' AND (p_salon_id IS NULL OR p.salon_id = p_salon_id OR p.salon_id IS NULL))
      OR (v_role <> 'superadmin' AND (p.salon_id = v_my_salon OR p.salon_id IS NULL))
    )
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- ==========================================
-- SINCRONIZACIÓN AUTOMÁTICA DE PERFILES
-- ==========================================

-- Función para manejar la creación automática de perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text := 'client';
  v_count int;
BEGIN
  -- Verificar si es el primer usuario de la plataforma
  SELECT count(*) INTO v_count FROM public.profiles;
  
  -- Lógica de primer usuario como superadmin (plataforma global)
  IF v_count = 0 THEN
    v_role := 'superadmin';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'), 
    new.email, 
    v_role
  );

  -- Sincronizar rol con metadata de auth.users para evitar recursión en RLS
  UPDATE auth.users 
  SET raw_app_meta_data = 
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb), 
      '{role}', 
      to_jsonb(v_role)
    )
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Trigger para ejecutar la función al insertar en auth.users
-- NOTA: Este trigger se aplica sobre el esquema auth de Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Función para sincronizar cambios de rol manuales a la metadata de auth
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    UPDATE auth.users 
    SET raw_app_meta_data = 
      jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb), 
        '{role}', 
        to_jsonb(NEW.role)
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- ==========================================
-- INSERTAR DATOS INICIALES (SERVICIOS)
-- ==========================================
INSERT INTO public.services (name, description, duration_minutes, price, category) 
SELECT 'Corte de Cabello', 'Corte personalizado con lavado y secado incluido', 45, 350, 'Cabello'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Corte de Cabello');

INSERT INTO public.services (name, description, duration_minutes, price, category) 
SELECT 'Tinte Completo', 'Aplicación de color completo con productos premium', 120, 1200, 'Cabello'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Tinte Completo');

INSERT INTO public.services (name, description, duration_minutes, price, category) 
SELECT 'Manicure Gel', 'Manicure con esmalte en gel de larga duración', 60, 450, 'Uñas'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Manicure Gel');

INSERT INTO public.services (name, description, duration_minutes, price, category) 
SELECT 'Facial Hidratante', 'Limpieza profunda e hidratación con productos naturales', 60, 800, 'Facial'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Facial Hidratante');

-- ==========================================
-- STORAGE: BUCKETS Y POLÍTICAS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('services_images', 'services_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imágenes de servicios públicas" ON storage.objects;
CREATE POLICY "Imágenes de servicios públicas"
  ON storage.objects FOR SELECT USING (bucket_id = 'services_images');

DROP POLICY IF EXISTS "Solo administradores pueden gestionar imágenes" ON storage.objects;
CREATE POLICY "Solo administradores pueden gestionar imágenes"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'services_images' AND 
    get_my_role() IN ('admin', 'superadmin')
  );

DROP POLICY IF EXISTS "Solo administradores pueden eliminar imágenes" ON storage.objects;
CREATE POLICY "Solo administradores pueden eliminar imágenes"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'services_images' AND 
    get_my_role() IN ('admin', 'superadmin')
  );

-- ==========================================
-- INVENTARIO Y PUNTO DE VENTA (POS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text,
  tax_treatment text NOT NULL DEFAULT 'gravado' CHECK (tax_treatment IN ('gravado', 'exento', 'excluido')),
  image_url text,
  is_active boolean DEFAULT true,
  salon_id uuid REFERENCES public.salons(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver productos activos con stock" ON public.products;
CREATE POLICY "Cualquiera puede ver productos activos con stock" 
  ON public.products FOR SELECT USING (is_active = true AND stock > 0);

DROP POLICY IF EXISTS "Administradores pueden gestionar todo el inventario" ON public.products;
CREATE POLICY "Administradores pueden gestionar todo el inventario" 
  ON public.products FOR ALL USING (
    get_my_role() IN ('admin', 'superadmin')
  );

CREATE TABLE IF NOT EXISTS public.product_sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id),
  seller_id uuid REFERENCES public.profiles(id),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  invoice_number text,
  salon_id uuid REFERENCES public.salons(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid REFERENCES public.product_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  service_id uuid REFERENCES public.services(id),
  appointment_id uuid REFERENCES public.appointments(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  subtotal numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_treatment text NOT NULL DEFAULT 'gravado' CHECK (tax_treatment IN ('gravado', 'exento', 'excluido')),
  vat_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  vat_amount numeric NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  line_total numeric NOT NULL DEFAULT 0 CHECK (line_total >= 0)
);

ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas para VENTAS
DROP POLICY IF EXISTS "Cualquiera puede ver sus compras" ON public.product_sales;
CREATE POLICY "Cualquiera puede ver sus compras" 
  ON public.product_sales FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Vendedores/Admins pueden ver todas las ventas" ON public.product_sales;
CREATE POLICY "Vendedores/Admins pueden ver todas las ventas" 
  ON public.product_sales FOR SELECT USING (
    get_my_role() IN ('admin', 'stylist', 'superadmin')
  );

DROP POLICY IF EXISTS "Solo administradores y staff insertan ventas" ON public.product_sales;
CREATE POLICY "Solo administradores y staff insertan ventas"
  ON public.product_sales FOR INSERT WITH CHECK (
    get_my_role() IN ('admin', 'stylist', 'superadmin')
  );

DROP POLICY IF EXISTS "Items de compras propias" ON public.sale_items;
CREATE POLICY "Items de compras propias" 
  ON public.sale_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.product_sales WHERE id = sale_id AND client_id = auth.uid())
  );

DROP POLICY IF EXISTS "Items vistos y insertados por admin/staff" ON public.sale_items;
CREATE POLICY "Items vistos y insertados por admin/staff" 
  ON public.sale_items FOR ALL USING (
    get_my_role() IN ('admin', 'stylist', 'superadmin')
  );

-- ==========================================
-- PROCESAMIENTO ATÓMICO DE LA VENTA
-- ==========================================
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

      -- Si es producto, validar y descontar stock
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
      SET stock = stock - v_quantity
      WHERE id = v_product.id;
    END IF;

      -- Si es cita, marcar como completada y pagada
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

    -- Registrar el item de venta
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
