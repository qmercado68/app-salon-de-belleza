import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmailHtml, type AppointmentEmailData } from "./email-template.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: AppointmentRecord;
  schema: string;
  old_record: AppointmentRecord | null;
}

interface AppointmentRecord {
  id: string;
  client_id: string;
  service_id: string;
  salon_id: string;
  appointment_date: string; // ISO 8601
  status: string;
  payment_method: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  allergies: string | null;
  salon_id: string;
  email?: string; // joined from auth.users when available
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  salon_id: string;
}

interface Salon {
  id: string;
  name: string;
  address: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Formats an ISO date string into Spanish readable format.
 * Example output: "Martes, 29 de marzo de 2026 a las 10:00 AM"
 */
function formatDateSpanish(isoDate: string): string {
  const date = new Date(isoDate);

  const dayName = DAYS_ES[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = MONTHS_ES[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${dayName}, ${day} de ${month} de ${year} a las ${hours}:${minutes} ${period}`;
}

/**
 * Sends a confirmation email via the Brevo transactional email API.
 * Returns true on success, false on any error (non-blocking).
 */
async function sendBrevoEmail(
  apiKey: string,
  senderEmail: string,
  senderName: string,
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[confirm-appointment] Brevo API error ${response.status}: ${body}`
      );
      return false;
    }

    console.log(
      `[confirm-appointment] Email sent successfully to ${toEmail}`
    );
    return true;
  } catch (err) {
    console.error("[confirm-appointment] Failed to call Brevo API:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Parse webhook payload
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // Only handle INSERT events on the appointments table
  if (payload.type !== "INSERT" || payload.table !== "appointments") {
    return new Response(
      JSON.stringify({ skipped: true, reason: "Not an appointment INSERT" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const appointment = payload.record;

  // Read required environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");

  if (!supabaseUrl || !serviceRoleKey || !brevoApiKey || !senderEmail) {
    console.error(
      "[confirm-appointment] Missing required environment variables."
    );
    // Return 200 so Supabase does not retry — this is a config error, not transient
    return new Response(
      JSON.stringify({ error: "Missing env vars" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build a service-role Supabase client to query related tables
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Fetch profile, service, and salon in parallel
  const [profileResult, serviceResult, salonResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, allergies, salon_id")
      .eq("id", appointment.client_id)
      .single(),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price, salon_id")
      .eq("id", appointment.service_id)
      .single(),
    supabase
      .from("salons")
      .select("id, name, address, phone")
      .eq("id", appointment.salon_id)
      .single(),
  ]);

  // Log and bail gracefully on DB errors — do NOT block appointment creation
  if (profileResult.error) {
    console.error(
      "[confirm-appointment] Could not fetch profile:",
      profileResult.error.message
    );
    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  if (serviceResult.error) {
    console.error(
      "[confirm-appointment] Could not fetch service:",
      serviceResult.error.message
    );
    return new Response(
      JSON.stringify({ error: "Service not found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  if (salonResult.error) {
    console.error(
      "[confirm-appointment] Could not fetch salon:",
      salonResult.error.message
    );
    return new Response(
      JSON.stringify({ error: "Salon not found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const profile = profileResult.data as Profile;
  const service = serviceResult.data as Service;
  const salon = salonResult.data as Salon;

  // Retrieve the client's email from auth.users via the admin API
  let clientEmail: string | null = null;
  try {
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(appointment.client_id);
    if (userError) {
      console.error(
        "[confirm-appointment] Could not fetch auth user:",
        userError.message
      );
    } else {
      clientEmail = userData?.user?.email ?? null;
    }
  } catch (err) {
    console.error("[confirm-appointment] Unexpected error fetching user:", err);
  }

  if (!clientEmail) {
    console.warn(
      "[confirm-appointment] No email found for client_id:",
      appointment.client_id
    );
    return new Response(
      JSON.stringify({ skipped: true, reason: "Client has no email" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build email data
  const emailData: AppointmentEmailData = {
    salonName: salon.name,
    salonAddress: salon.address,
    salonPhone: salon.phone,
    clientName: profile.full_name,
    clientEmail,
    serviceName: service.name,
    serviceDuration: service.duration_minutes,
    appointmentDate: formatDateSpanish(appointment.appointment_date),
    hasAllergies:
      profile.allergies !== null &&
      profile.allergies.trim().length > 0,
  };

  const htmlContent = buildEmailHtml(emailData);

  const subject = `Confirmacion de cita en ${salon.name}`;

  // Send email — non-blocking: log errors but always return 200
  await sendBrevoEmail(
    brevoApiKey,
    senderEmail,
    salon.name,
    clientEmail,
    profile.full_name,
    subject,
    htmlContent
  );

  return new Response(
    JSON.stringify({ success: true, appointmentId: appointment.id }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ---------------------------------------------------------------------------
// DATABASE WEBHOOK — paste this SQL in the Supabase SQL Editor
// ---------------------------------------------------------------------------
//
// INSTRUCCIONES:
// 1. Ve a tu proyecto en https://supabase.com/dashboard
// 2. En el menu lateral: Database > Webhooks > Create a new webhook
//    (o usa el SQL Editor y ejecuta la query de abajo)
// 3. Asegurate de que la Edge Function ya esta desplegada antes de activar
//    el webhook (ver seccion "Despliegue" abajo).
//
// ---- OPCION A: Desde la UI de Supabase ----
//   - Name: confirm-appointment-on-insert
//   - Table: appointments
//   - Events: INSERT
//   - Type: Supabase Edge Functions
//   - Edge Function: confirm-appointment
//   - HTTP Headers: { "Content-Type": "application/json" }
//
// ---- OPCION B: SQL (pegar en SQL Editor) ----
/*

select
  supabase_functions.http_request(
    'POST',
    '<YOUR_PROJECT_URL>/functions/v1/confirm-appointment',
    '{"Content-Type":"application/json","Authorization":"Bearer <YOUR_ANON_KEY>"}',
    '{}',
    '1000'
  );

-- Webhook via pg_net + supabase_functions extension:
-- (Supabase lo crea automaticamente si usas la UI.
--  Si prefieres SQL puro, usa el Dashboard > Database > Webhooks.)

*/
//
// ---------------------------------------------------------------------------
// DESPLIEGUE DE LA EDGE FUNCTION
// ---------------------------------------------------------------------------
//
// Requisitos: Supabase CLI instalado (https://supabase.com/docs/guides/cli)
//
// 1. Autenticarse:
//    supabase login
//
// 2. Vincular el proyecto local (solo primera vez):
//    supabase link --project-ref <YOUR_PROJECT_REF>
//
// 3. Configurar secrets (variables de entorno):
//    supabase secrets set BREVO_API_KEY=<tu-api-key-de-brevo>
//    supabase secrets set BREVO_SENDER_EMAIL=<email-verificado-en-brevo>
//    (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son inyectadas automaticamente)
//
// 4. Desplegar la funcion:
//    supabase functions deploy confirm-appointment
//
// 5. (Opcional) Probar localmente:
//    supabase functions serve confirm-appointment --env-file .env.local
//    curl -i --location --request POST \
//      'http://localhost:54321/functions/v1/confirm-appointment' \
//      --header 'Authorization: Bearer <ANON_KEY>' \
//      --header 'Content-Type: application/json' \
//      --data '{"type":"INSERT","table":"appointments","schema":"public","record":{"id":"test-id","client_id":"<uuid>","service_id":"<uuid>","salon_id":"<uuid>","appointment_date":"2026-03-29T10:00:00Z","status":"confirmed","payment_method":"cash"},"old_record":null}'
//
// ---------------------------------------------------------------------------
