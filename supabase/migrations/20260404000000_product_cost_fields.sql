-- Agregar campos de costo y fecha de compra a productos
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0 CHECK (cost_price >= 0),
  ADD COLUMN IF NOT EXISTS purchase_date date;
