-- Migration: appointment_services junction table
-- Allows multiple services per appointment (multi-select booking flow)
-- The primary service_id on appointments is kept for backward compatibility.

CREATE TABLE IF NOT EXISTS public.appointment_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(appointment_id, service_id)
);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- Clients and stylists can read their own appointment services
CREATE POLICY "appointment_services_select" ON public.appointment_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
        AND (a.client_id = auth.uid() OR a.stylist_id = auth.uid())
    )
  );

-- Only the client who owns the appointment can insert extra services
CREATE POLICY "appointment_services_insert" ON public.appointment_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id AND a.client_id = auth.uid()
    )
  );

-- Admins and superadmins can manage all appointment_services
CREATE POLICY "appointment_services_admin" ON public.appointment_services
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));
