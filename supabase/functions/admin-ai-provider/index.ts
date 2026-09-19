import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const SaveSchema = z.object({
  action: z.literal("save"),
  provider: z.enum(["lovable", "openrouter"]),
  lovable_model: z.string().trim().min(1).max(150),
  openrouter_model: z.string().trim().min(1).max(150),
  openrouter_api_key: z.string().trim().max(500).nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authorization = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Sesi admin tidak valid" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Akses hanya untuk admin" }, 403);

    const body = await req.json().catch(() => ({}));
    if (body.action === "get") {
      const [{ data: settings, error: settingsError }, { data: secret, error: secretError }] = await Promise.all([
        admin.from("app_settings").select("key,value").in("key", ["ai_provider", "ai_lovable_model", "ai_openrouter_model"]),
        admin.from("ai_provider_secrets").select("provider,updated_at").eq("provider", "openrouter").maybeSingle(),
      ]);
      if (settingsError || secretError) throw settingsError ?? secretError;
      const map = Object.fromEntries((settings ?? []).map((row) => [row.key, String(row.value ?? "").trim()]));
      return json({
        provider: map.ai_provider === "openrouter" ? "openrouter" : "lovable",
        lovable_model: map.ai_lovable_model || "openai/gpt-6-astra",
        openrouter_model: map.ai_openrouter_model || "openai/gpt-4o-mini",
        openrouter_connected: Boolean(secret),
        openrouter_updated_at: secret?.updated_at ?? null,
      });
    }

    const parsed = SaveSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Pengaturan AI tidak valid" }, 400);
    const input = parsed.data;
    if (input.openrouter_api_key && !input.openrouter_api_key.startsWith("sk-or-")) {
      return json({ error: "Format API key OpenRouter tidak valid" }, 400);
    }
    if (input.provider === "openrouter" && !input.openrouter_api_key) {
      const { data: existing } = await admin.from("ai_provider_secrets").select("provider").eq("provider", "openrouter").maybeSingle();
      if (!existing) return json({ error: "Masukkan API key OpenRouter terlebih dahulu" }, 400);
    }

    const now = new Date().toISOString();
    const { error: settingsError } = await admin.from("app_settings").upsert([
      { key: "ai_provider", value: input.provider, updated_at: now },
      { key: "ai_lovable_model", value: input.lovable_model, updated_at: now },
      { key: "ai_openrouter_model", value: input.openrouter_model, updated_at: now },
    ], { onConflict: "key" });
    if (settingsError) throw settingsError;
    if (input.openrouter_api_key) {
      const { error: secretError } = await admin.from("ai_provider_secrets").upsert({
        provider: "openrouter",
        api_key: input.openrouter_api_key,
        updated_at: now,
      }, { onConflict: "provider" });
      if (secretError) throw secretError;
    }
    return json({ ok: true, openrouter_connected: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan AI" }, 500);
  }
});
