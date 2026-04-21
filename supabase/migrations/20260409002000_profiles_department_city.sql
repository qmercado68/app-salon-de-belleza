-- ==========================================
-- MIGRACIÓN: Departamento y ciudad en perfiles
-- ==========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS city text;
