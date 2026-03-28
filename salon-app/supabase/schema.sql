-- ==========================================
-- App de Gestión para Salón de Belleza
-- Esquema de Base de Datos (Supabase / PostgreSQL)
-- ==========================================

-- Habilitar la extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE PERFILES (Extiende auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  address text,
  blood_type varchar(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  medical_conditions text,
  allergies text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin', 'stylist')),
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DE SERVICIOS
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE CITAS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  stylist_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_date timestamp with time zone NOT NULL,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  payment_method text DEFAULT 'efectivo',
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- SEGURIDAD: RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFILES
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los perfiles" 
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para SERVICIOS
CREATE POLICY "Cualquiera puede ver los servicios activos" 
  ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Solo administradores pueden gestionar servicios" 
  ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para CITAS
CREATE POLICY "Los clientes pueden ver sus propias citas" 
  ON public.appointments FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Los clientes pueden crear sus propias citas" 
  ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Los clientes pueden cancelar sus citas (si faltan > 24h)" 
  ON public.appointments FOR UPDATE USING (
    auth.uid() = client_id AND 
    status = 'pendiente' AND
    appointment_date > (now() + interval '24 hours')
  );

CREATE POLICY "Admins y estilistas pueden ver todas las citas" 
  ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist'))
  );

CREATE POLICY "Solo admins pueden marcar como pagado o completar" 
  ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

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

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- INSERTAR DATOS INICIALES (SERVICIOS)
-- ==========================================
INSERT INTO public.services (name, description, duration_minutes, price, category) VALUES
('Corte de Cabello', 'Corte personalizado con lavado y secado incluido', 45, 350, 'Cabello'),
('Tinte Completo', 'Aplicación de color completo con productos premium', 120, 1200, 'Cabello'),
('Manicure Gel', 'Manicure con esmalte en gel de larga duración', 60, 450, 'Uñas'),
('Facial Hidratante', 'Limpieza profunda e hidratación con productos naturales', 60, 800, 'Facial');
