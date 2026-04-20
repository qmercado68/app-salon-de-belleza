-- Allow stylists to read profiles of clients who have appointments assigned to them
-- This is needed so the stylist calendar can show client name and phone

DROP POLICY IF EXISTS "Estilistas ven perfiles de sus clientes" ON public.profiles;

CREATE POLICY "Estilistas ven perfiles de sus clientes"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() = 'stylist'
    AND id IN (
      SELECT client_id FROM public.appointments
      WHERE stylist_id = auth.uid()
    )
  );
