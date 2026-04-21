-- Agregar referencia a terceros (proveedor) en productos
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tercero_id uuid REFERENCES public.terceros(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_tercero_id ON public.products(tercero_id);
