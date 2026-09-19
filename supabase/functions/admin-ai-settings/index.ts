import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";
import { corsHeaders, json } from "../_shared/staff-auth.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function requireAdmin(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const user = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error } = await user.auth.getUser();
  if (error || !authData.user) return { error: json({ error: "Sesi admin tidak valid" }, 401) };
  const { data: isAdmin, error: roleError } = await user.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
  if (roleError || !isAdmin) return { error: json({ error: "Khusus administrator" }, 403) };
  return { user: authData.user, admin };
}

function isMissingHistoryTable(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.message?.includes("ai_provider_config_history") === true;
}

async function addHistory(admin: ReturnType<typeof createClient>, entry: Record<string, unknown>) {
  const { error } = await admin.from("ai_provider_config_history").insert(entry);
  if (error && !isMissingHistoryTable(error)) throw error;
}

async function currentConfig(admin: ReturnType<typeof createClient>) {
  const [settingsResult, secretResult] = await Promise.all([
    admin.from("app_settings").select("key,value").in("key", ["ai_provider", "ai_openrouter_model"]),
    admin.from("ai_provider_secrets").select("provider,updated_at").eq("provider", "openrouter").maybeSingle(),
  ]);
  if (settingsResult.error) throw settingsResult.error;
  if (secretResult.error) throw secretResult.error;
  const historyResult = await admin.from("ai_provider_config_history").select("id,model,action,api_key_changed,created_at").order("created_at", { ascending: false }).limit(20);
  if (historyResult.error && !isMissingHistoryTable(historyResult.error)) throw historyResult.error;
  const map = Object.fromEntries((settingsResult.data ?? []).map((row) => [row.key, row.value]));
  return {
    provider: "openrouter",
    model: String(map.ai_openrouter_model ?? "openai/gpt-4o-mini"),
    api_key_configured: Boolean(secretResult.data),
    api_key_updated_at: secretResult.data?.updated_at ?? null,
    history: historyResult.error ? [] : historyResult.data ?? [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { admin, user } = auth;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "get");

    if (action === "get") return json(await currentConfig(admin));

    if (action === "save") {
      const model = String(body.model ?? "").trim();
      const apiKey = String(body.api_key ?? "").trim();
      if (!model || model.length > 160 || !model.includes("/")) return json({ error: "ID model OpenRouter tidak valid" }, 400);
      if (apiKey && (!apiKey.startsWith("sk-or-") || apiKey.length < 30)) return json({ error: "Format API key OpenRouter tidak valid" }, 400);

      const { error: settingError } = await admin.from("app_settings").upsert([
        { key: "ai_provider", value: "openrouter" },
        { key: "ai_openrouter_model", value: model },
      ], { onConflict: "key" });
      if (settingError) throw settingError;

      if (apiKey) {
        const { error: secretError } = await admin.from("ai_provider_secrets").upsert({
          provider: "openrouter", api_key: apiKey, updated_by: user.id, updated_at: new Date().toISOString(),
        }, { onConflict: "provider" });
        if (secretError) throw secretError;
      }
      await addHistory(admin, {
        model, action: "saved", api_key_changed: Boolean(apiKey), changed_by: user.id,
      });
      return json({ ok: true, ...(await currentConfig(admin)) });
    }

    if (action === "test") {
      const [{ data: secret, error: secretError }, config] = await Promise.all([
        admin.from("ai_provider_secrets").select("api_key").eq("provider", "openrouter").maybeSingle(), currentConfig(admin),
      ]);
      if (secretError) throw secretError;
      if (!secret?.api_key) return json({ error: "API key OpenRouter belum disimpan" }, 400);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret.api_key}`, "HTTP-Referer": "https://safariman.id", "X-Title": "Safar Iman" },
        body: JSON.stringify({ model: config.model, messages: [{ role: "user", content: "Balas tepat dengan kata OK." }], max_tokens: 5, temperature: 0 }),
      });
      const responseBody = await response.text();
      if (!response.ok) {
        let message = `OpenRouter menolak permintaan (${response.status})`;
        try { message = JSON.parse(responseBody)?.error?.message ?? message; } catch { /* safe fallback */ }
        return json({ error: message }, 400);
      }
      return json({ ok: true, model: config.model });
    }

    if (action === "remove_key") {
      const config = await currentConfig(admin);
      const { error } = await admin.from("ai_provider_secrets").delete().eq("provider", "openrouter");
      if (error) throw error;
      await addHistory(admin, {
        model: config.model, action: "key_removed", api_key_changed: true, changed_by: user.id,
      });
      return json({ ok: true, ...(await currentConfig(admin)) });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan" }, 500);
  }
});
