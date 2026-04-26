-- Migration: fix get_busy_slots para sumar duración de servicios adicionales
--
-- Bug: el RPC `get_busy_slots` solo consideraba la duración del servicio
-- primario (`appointments.service_id`) e ignoraba los servicios adicionales
-- guardados en la junction table `appointment_services`. Esto permitía
-- double-booking silencioso cuando una cita tenía múltiples servicios:
-- el frontend bloqueaba slots por la duración total al crear la cita,
-- pero al consultar disponibilidad solo veía la duración del servicio
-- primario, dejando libres slots realmente ocupados.
--
-- Fix: la función ahora devuelve UNA fila por cita con la duración total
-- (servicio primario + SUMA de duraciones de `appointment_services`).
-- Mantenemos el mismo nombre, firma y columnas de retorno
-- (`appointment_date`, `duration_minutes`) para no romper consumidores
-- (api.ts → getAvailableTimeSlots).
--
-- Citas sin servicios adicionales siguen funcionando: el LEFT JOIN +
-- COALESCE(SUM(...), 0) devuelve 0 para los extras, dejando la duración
-- del servicio primario intacta.

CREATE OR REPLACE FUNCTION public.get_busy_slots(p_stylist_id uuid, p_date date)
RETURNS TABLE (appointment_date timestamp with time zone, duration_minutes int) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.appointment_date,
    (s.duration_minutes + COALESCE(extras.extra_minutes, 0))::int AS duration_minutes
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  LEFT JOIN (
    SELECT
      aps.appointment_id,
      SUM(svc.duration_minutes)::int AS extra_minutes
    FROM public.appointment_services aps
    JOIN public.services svc ON svc.id = aps.service_id
    GROUP BY aps.appointment_id
  ) extras ON extras.appointment_id = a.id
  WHERE a.stylist_id = p_stylist_id
    AND a.appointment_date::date = p_date
    AND a.status != 'cancelada';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
