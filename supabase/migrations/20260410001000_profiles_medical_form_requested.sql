-- ==========================================
-- MIGRACIÓN: Flag de ficha médica solicitada
-- ==========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS medical_form_requested boolean DEFAULT false;

UPDATE public.profiles
SET medical_form_requested = false
WHERE medical_form_requested IS NULL;
