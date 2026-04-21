import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateUserPayload = {
  email: string;
  role: "client" | "admin" | "stylist" | "superadmin";
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  salonId?: string;
  phone?: string;
};

const ROLE_OPTIONS = ["client", "admin", "stylist", "superadmin"] as const;

const buildFullName = (payload: CreateUserPayload) => {
  const parts = [
    payload.firstName?.trim(),
    payload.secondName?.trim(),
    payload.lastName?.trim(),
    payload.secondLastName?.trim(),
  ].filter((value) => value && value.length > 0);

  return parts.join(" ").trim();
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return new Response(JSON.stringify({ error: "Token requerido." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing env vars." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const requesterRole = (userData.user.app_metadata as { role?: string })?.role;
  if (!requesterRole || !["admin", "superadmin"].includes(requesterRole)) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ROLE_OPTIONS.includes(payload.role)) {
    return new Response(JSON.stringify({ error: "Rol inválido." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payload.role === "superadmin" && requesterRole !== "superadmin") {
    return new Response(JSON.stringify({ error: "Solo superadmin puede crear superadmin." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fullName = buildFullName(payload) || email.split("@")[0] || "Usuario";

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      first_name: payload.firstName || "",
      second_name: payload.secondName || "",
      last_name: payload.lastName || "",
      second_last_name: payload.secondLastName || "",
    },
  });

  if (inviteError || !inviteData?.user) {
    return new Response(JSON.stringify({ error: inviteError?.message || "No se pudo invitar al usuario." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = inviteData.user.id;

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: payload.role },
    user_metadata: {
      full_name: fullName,
      first_name: payload.firstName || "",
      second_name: payload.secondName || "",
      last_name: payload.lastName || "",
      second_last_name: payload.secondLastName || "",
    },
  });

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    email,
    role: payload.role,
    first_name: payload.firstName || null,
    second_name: payload.secondName || null,
    last_name: payload.lastName || null,
    second_last_name: payload.secondLastName || null,
    salon_id: payload.salonId || null,
    phone: payload.phone || null,
  });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, userId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
