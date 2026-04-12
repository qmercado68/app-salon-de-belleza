-- ==========================================
-- MIGRACIÓN: Eliminar citas no pagas
-- ==========================================

DROP POLICY IF EXISTS "Clientes pueden eliminar citas no pagas" ON public.appointments;
CREATE POLICY "Clientes pueden eliminar citas no pagas"
  ON public.appointments FOR DELETE USING (
    (
      auth.uid() = client_id
      AND is_paid = false
      AND status IN ('pendiente', 'confirmada')
      AND appointment_date > (now() + interval '24 hours')
    )
    OR (public.get_my_role() IN ('admin', 'stylist', 'superadmin') AND is_paid = false)
  );
