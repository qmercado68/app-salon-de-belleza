-- NIT único por salón para evitar terceros duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_terceros_nit_salon_unique
  ON public.terceros(nit, salon_id) WHERE is_active = true;
