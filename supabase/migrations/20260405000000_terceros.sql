-- ==========================================
-- MIGRACIÓN: Tabla de Terceros (proveedores, clientes externos, etc.)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.terceros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nit text NOT NULL,
  nombre text NOT NULL,
  direccion text,
  telefono text,
  departamento text,
  ciudad text,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_terceros ON public.terceros;
CREATE TRIGGER set_updated_at_terceros
  BEFORE UPDATE ON public.terceros
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.terceros ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "terceros_superadmin_all" ON public.terceros;
CREATE POLICY "terceros_superadmin_all"
  ON public.terceros FOR ALL USING (
    public.get_my_role() = 'superadmin'
  );

DROP POLICY IF EXISTS "terceros_same_salon_select" ON public.terceros;
CREATE POLICY "terceros_same_salon_select"
  ON public.terceros FOR SELECT USING (
    salon_id = public.get_my_salon_id()
  );

DROP POLICY IF EXISTS "terceros_same_salon_admin_all" ON public.terceros;
CREATE POLICY "terceros_same_salon_admin_all"
  ON public.terceros FOR ALL USING (
    salon_id = public.get_my_salon_id()
    AND public.get_my_role() = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_terceros_salon_id ON public.terceros(salon_id);
CREATE INDEX IF NOT EXISTS idx_terceros_nit ON public.terceros(nit);
