-- Fix: infinite recursion (42P17) when a CLIENT reads appointments with profiles join.
--
-- Root cause:
--   Policy "Estilistas ven perfiles de sus clientes" on public.profiles contains a
--   subquery: id IN (SELECT client_id FROM public.appointments WHERE stylist_id = auth.uid()).
--   When PostgREST runs:
--     SELECT * FROM appointments JOIN profiles ON profiles.id = appointments.client_id
--   PostgreSQL evaluates profiles RLS, which fires the policy, which queries appointments,
--   which re-evaluates appointments RLS, which JOINs profiles again → infinite loop.
--
-- Fix:
--   Replace the inline subquery with a SECURITY DEFINER helper function.
--   SECURITY DEFINER bypasses RLS on appointments, breaking the cycle.

-- 1. Helper: returns client_ids of the current stylist's appointments (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_stylist_client_ids()
RETURNS SETOF uuid AS $$
  SELECT DISTINCT client_id
  FROM public.appointments
  WHERE stylist_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Recreate the policy using the safe helper
DROP POLICY IF EXISTS "Estilistas ven perfiles de sus clientes" ON public.profiles;

CREATE POLICY "Estilistas ven perfiles de sus clientes"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() = 'stylist'
    AND id IN (SELECT public.get_my_stylist_client_ids())
  );
