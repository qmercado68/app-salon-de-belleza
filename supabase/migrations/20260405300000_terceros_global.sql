-- Terceros pasan a ser globales (compartidos entre salones)

-- Quitar el índice único por salón
DROP INDEX IF EXISTS idx_terceros_nit_salon_unique;

-- Crear índice único solo por NIT (global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_terceros_nit_unique
  ON public.terceros(nit) WHERE is_active = true;

-- Actualizar RLS: cualquier usuario autenticado puede ver terceros
DROP POLICY IF EXISTS "terceros_same_salon_select" ON public.terceros;
CREATE POLICY "terceros_authenticated_select"
  ON public.terceros FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Cualquier admin puede gestionar terceros
DROP POLICY IF EXISTS "terceros_same_salon_admin_all" ON public.terceros;
CREATE POLICY "terceros_admin_all"
  ON public.terceros FOR ALL USING (
    public.get_my_role() IN ('admin', 'superadmin')
  );
