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
  email text, -- Sincronizado desde auth.users
  document_id text,
  birth_date date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  phone text,
  address text,
  blood_type varchar(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  medical_conditions text,
  allergies text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin', 'stylist')),
  specialty text,
  avatar_url text,
  work_start_time time DEFAULT '09:00:00',
  work_end_time time DEFAULT '18:00:00',
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

CREATE POLICY "Los administradores pueden actualizar cualquier perfil"
  ON public.profiles FOR UPDATE USING (
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
  
  -- Lógica de primer usuario como administrador
  IF v_count = 0 THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'), 
    new.email, 
    v_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función al insertar en auth.users
-- NOTA: Este trigger se aplica sobre el esquema auth de Supabase
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- ==========================================
-- STORAGE: BUCKETS Y POLÍTICAS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('services_images', 'services_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imágenes de servicios públicas"
  ON storage.objects FOR SELECT USING (bucket_id = 'services_images');

CREATE POLICY "Solo administradores pueden subir imágenes"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'services_images' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Solo administradores pueden eliminar imágenes"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'services_images' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- INVENTARIO Y PUNTO DE VENTA (POS)
-- ==========================================

CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text,
  image_url text,
  is_active boolean DEFAULT true,
  salon_id uuid REFERENCES public.salons(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver productos activos con stock" 
  ON public.products FOR SELECT USING (is_active = true AND stock > 0);

CREATE POLICY "Administradores pueden gestionar todo el inventario" 
  ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE public.product_sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id),
  seller_id uuid REFERENCES public.profiles(id),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  salon_id uuid REFERENCES public.salons(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sale_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid REFERENCES public.product_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  service_id uuid REFERENCES public.services(id),
  appointment_id uuid REFERENCES public.appointments(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  subtotal numeric GENERATED ALWAYS AS (quantity * unit_price) STORED
);

ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver sus compras" 
  ON public.product_sales FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Vendedores/Admins pueden ver todas las ventas" 
  ON public.product_sales FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist'))
  );

CREATE POLICY "Solo administradores y cajeros insertan ventas"
  ON public.product_sales FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist'))
  );

CREATE POLICY "Items de compras propias" 
  ON public.sale_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.product_sales WHERE id = sale_id AND client_id = auth.uid())
  );

CREATE POLICY "Items vistos y insertados por admin/staff" 
  ON public.sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'stylist'))
  );

-- ==========================================
-- PROCESAMIENTO ATÓMICO DE LA VENTA
-- ==========================================
CREATE OR REPLACE FUNCTION process_sale(
  p_client_id uuid,
  p_seller_id uuid,
  p_payment_method text,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_sale_id uuid;
  v_total numeric := 0;
  v_item record;
  v_product record;
  v_unit_price numeric;
BEGIN
  INSERT INTO public.product_sales (client_id, seller_id, total_amount, payment_method)
  VALUES (p_client_id, p_seller_id, 0, p_payment_method)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_unit_price := (v_item.value->>'unit_price')::numeric;
    v_total := v_total + (v_unit_price * (v_item.value->>'quantity')::integer);

    -- Si es producto, validar y descontar stock
    IF v_item.value->>'product_id' IS NOT NULL THEN
      SELECT id, stock INTO v_product FROM public.products 
      WHERE id = (v_item.value->>'product_id')::uuid AND is_active = true FOR UPDATE;

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

    -- Si es cita, marcar como completada y pagada
    IF v_item.value->>'appointment_id' IS NOT NULL THEN
      UPDATE public.appointments 
      SET status = 'completada', is_paid = true, payment_method = p_payment_method
      WHERE id = (v_item.value->>'appointment_id')::uuid;
    END IF;

    -- Registrar el item de venta
    INSERT INTO public.sale_items (
      sale_id, 
      product_id, 
      service_id, 
      appointment_id, 
      quantity, 
      unit_price
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
