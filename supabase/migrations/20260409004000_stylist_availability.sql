-- ==========================================
-- MIGRACIÓN: Disponibilidad y descanso de estilistas
-- ==========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS break_start_time time,
  ADD COLUMN IF NOT EXISTS break_end_time time;

CREATE TABLE IF NOT EXISTS public.stylist_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  is_all_day boolean DEFAULT true,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_stylist_unavailability ON public.stylist_unavailability;
CREATE TRIGGER set_updated_at_stylist_unavailability
  BEFORE UPDATE ON public.stylist_unavailability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.stylist_unavailability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stylist_unavailability_select" ON public.stylist_unavailability;
CREATE POLICY "stylist_unavailability_select"
  ON public.stylist_unavailability FOR SELECT USING (
    public.get_my_role() = 'superadmin'
    OR salon_id = public.get_my_salon_id()
    OR stylist_id = auth.uid()
  );

DROP POLICY IF EXISTS "stylist_unavailability_insert" ON public.stylist_unavailability;
CREATE POLICY "stylist_unavailability_insert"
  ON public.stylist_unavailability FOR INSERT WITH CHECK (
    public.get_my_role() = 'superadmin'
    OR (public.get_my_role() = 'admin' AND salon_id = public.get_my_salon_id())
    OR (stylist_id = auth.uid() AND salon_id = public.get_my_salon_id())
  );

DROP POLICY IF EXISTS "stylist_unavailability_update" ON public.stylist_unavailability;
CREATE POLICY "stylist_unavailability_update"
  ON public.stylist_unavailability FOR UPDATE USING (
    public.get_my_role() = 'superadmin'
    OR (public.get_my_role() = 'admin' AND salon_id = public.get_my_salon_id())
    OR stylist_id = auth.uid()
  );

DROP POLICY IF EXISTS "stylist_unavailability_delete" ON public.stylist_unavailability;
CREATE POLICY "stylist_unavailability_delete"
  ON public.stylist_unavailability FOR DELETE USING (
    public.get_my_role() = 'superadmin'
    OR (public.get_my_role() = 'admin' AND salon_id = public.get_my_salon_id())
    OR stylist_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_stylist_unavailability_stylist_date
  ON public.stylist_unavailability(stylist_id, date);
CREATE INDEX IF NOT EXISTS idx_stylist_unavailability_salon_id
  ON public.stylist_unavailability(salon_id);
