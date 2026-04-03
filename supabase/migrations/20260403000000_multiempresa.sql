-- ==========================================
-- MIGRACIÓN: Plataforma Multi-Empresa (SaaS)
-- Opción B: Clientes aislados por salón
-- ==========================================

-- ----------------------------------------
-- 1. TABLA RAÍZ: salons
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
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

CREATE TRIGGER set_updated_at_salons
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- 2. AÑADIR salon_id A TABLAS EXISTENTES
-- ----------------------------------------

-- profiles: un perfil (cliente, estilista, admin) pertenece a UN salón
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES public.salons(id) ON DELETE SET NULL;

-- services: catálogo exclusivo por salón
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE;

-- appointments: las citas nunca se mezclan entre salones
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE;

-- ----------------------------------------
-- 3. ACTUALIZAR CONSTRAINT DE ROLES
-- ----------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'admin', 'stylist', 'superadmin'));

-- ----------------------------------------
-- 4. FUNCIONES HELPER DE SEGURIDAD
-- ----------------------------------------

-- Devuelve el salon_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_salon_id()
RETURNS uuid AS $$
  SELECT salon_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Devuelve el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------
-- 5. RLS: SALONS
-- ----------------------------------------

-- Cualquiera puede ver salones activos (para la página de selección)
CREATE POLICY "salons_public_read"
  ON public.salons FOR SELECT USING (is_active = true);

-- Solo superadmin puede crear/editar/eliminar salones
CREATE POLICY "salons_superadmin_all"
  ON public.salons FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

-- El propietario puede actualizar su propio salón
CREATE POLICY "salons_owner_update"
  ON public.salons FOR UPDATE USING (
    owner_id = auth.uid()
  );

-- ----------------------------------------
-- 6. RLS: PROFILES (salon-aware)
-- ----------------------------------------

-- Eliminar políticas globales anteriores
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Los administradores pueden actualizar cualquier perfil" ON public.profiles;

-- Superadmin ve todo
CREATE POLICY "profiles_superadmin_all"
  ON public.profiles FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

-- Usuario ve su propio perfil
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT USING (
    id = auth.uid()
  );

-- Usuario actualiza su propio perfil
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE USING (
    id = auth.uid()
  );

-- Admin/estilista del mismo salón ven todos los perfiles de ese salón
CREATE POLICY "profiles_same_salon_staff_select"
  ON public.profiles FOR SELECT USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() IN ('admin', 'stylist')
  );

-- Admin del mismo salón puede actualizar perfiles del salón
CREATE POLICY "profiles_same_salon_admin_update"
  ON public.profiles FOR UPDATE USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() = 'admin'
  );

-- Permitir INSERT de nuevos perfiles (trigger de auto-registro)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT WITH CHECK (
    id = auth.uid()
  );

-- ----------------------------------------
-- 7. RLS: SERVICES (salon-aware)
-- ----------------------------------------

DROP POLICY IF EXISTS "Cualquiera puede ver los servicios activos" ON public.services;
DROP POLICY IF EXISTS "Solo administradores pueden gestionar servicios" ON public.services;

-- Superadmin ve todo
CREATE POLICY "services_superadmin_all"
  ON public.services FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

-- Usuarios del mismo salón ven los servicios activos de ese salón
CREATE POLICY "services_same_salon_select"
  ON public.services FOR SELECT USING (
    salon_id = public.get_my_salon_id()
    AND is_active = true
  );

-- Admin del mismo salón gestiona servicios
CREATE POLICY "services_same_salon_admin_all"
  ON public.services FOR ALL USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() = 'admin'
  );

-- ----------------------------------------
-- 8. RLS: APPOINTMENTS (salon-aware)
-- ----------------------------------------

DROP POLICY IF EXISTS "Los clientes pueden ver sus propias citas" ON public.appointments;
DROP POLICY IF EXISTS "Los clientes pueden crear sus propias citas" ON public.appointments;
DROP POLICY IF EXISTS "Los clientes pueden cancelar sus citas (si faltan > 24h)" ON public.appointments;
DROP POLICY IF EXISTS "Admins y estilistas pueden ver todas las citas" ON public.appointments;
DROP POLICY IF EXISTS "Solo admins pueden marcar como pagado o completar" ON public.appointments;

-- Superadmin ve todo
CREATE POLICY "appointments_superadmin_all"
  ON public.appointments FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

-- Cliente ve sus propias citas dentro de su salón
CREATE POLICY "appointments_client_select"
  ON public.appointments FOR SELECT USING (
    client_id = auth.uid()
    AND salon_id = public.get_my_salon_id()
  );

-- Cliente puede crear citas en su salón
CREATE POLICY "appointments_client_insert"
  ON public.appointments FOR INSERT WITH CHECK (
    client_id = auth.uid()
    AND salon_id = public.get_my_salon_id()
  );

-- Cliente puede cancelar sus citas pendientes con > 24h de anticipación
CREATE POLICY "appointments_client_cancel"
  ON public.appointments FOR UPDATE USING (
    client_id = auth.uid()
    AND salon_id = public.get_my_salon_id()
    AND status = 'pendiente'
    AND appointment_date > (now() + interval '24 hours')
  );

-- Staff (admin/estilista) ve todas las citas de su salón
CREATE POLICY "appointments_staff_select"
  ON public.appointments FOR SELECT USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() IN ('admin', 'stylist')
  );

-- Admin gestiona todas las citas de su salón
CREATE POLICY "appointments_admin_all"
  ON public.appointments FOR ALL USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() = 'admin'
  );

-- ----------------------------------------
-- 9. RLS: PRODUCTS (salon-aware)
-- ----------------------------------------

DROP POLICY IF EXISTS "Cualquiera puede ver productos activos con stock" ON public.products;
DROP POLICY IF EXISTS "Administradores pueden gestionar todo el inventario" ON public.products;

CREATE POLICY "products_superadmin_all"
  ON public.products FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

CREATE POLICY "products_same_salon_select"
  ON public.products FOR SELECT USING (
    salon_id = public.get_my_salon_id()
    AND is_active = true
  );

CREATE POLICY "products_same_salon_admin_all"
  ON public.products FOR ALL USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() = 'admin'
  );

-- ----------------------------------------
-- 10. RLS: PRODUCT_SALES (salon-aware)
-- ----------------------------------------

DROP POLICY IF EXISTS "Cualquiera puede ver sus compras" ON public.product_sales;
DROP POLICY IF EXISTS "Vendedores/Admins pueden ver todas las ventas" ON public.product_sales;
DROP POLICY IF EXISTS "Solo administradores y cajeros insertan ventas" ON public.product_sales;

CREATE POLICY "product_sales_superadmin_all"
  ON public.product_sales FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

CREATE POLICY "product_sales_client_own"
  ON public.product_sales FOR SELECT USING (
    client_id = auth.uid()
    AND salon_id = public.get_my_salon_id()
  );

CREATE POLICY "product_sales_staff_select"
  ON public.product_sales FOR SELECT USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() IN ('admin', 'stylist')
  );

CREATE POLICY "product_sales_staff_insert"
  ON public.product_sales FOR INSERT WITH CHECK (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() IN ('admin', 'stylist')
  );

-- ----------------------------------------
-- 11. ACTUALIZAR process_sale PARA INCLUIR salon_id
-- ----------------------------------------
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
BEGIN
  -- Resolver salon_id: usar el parámetro o derivar del vendedor
  IF p_salon_id IS NOT NULL THEN
    v_resolved_salon_id := p_salon_id;
  ELSE
    SELECT salon_id INTO v_resolved_salon_id
    FROM public.profiles WHERE id = p_seller_id;
  END IF;

  INSERT INTO public.product_sales (client_id, seller_id, total_amount, payment_method, salon_id)
  VALUES (p_client_id, p_seller_id, 0, p_payment_method, v_resolved_salon_id)
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

-- ----------------------------------------
-- 12. ÍNDICES DE RENDIMIENTO
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON public.profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON public.appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_salon_id ON public.products(salon_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_salon_id ON public.product_sales(salon_id);
