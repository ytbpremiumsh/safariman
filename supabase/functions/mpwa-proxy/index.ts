import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

// Proxy ke MPWA (app.ayopintar.com) untuk bypass CORS browser.
// Body: { endpoint: "generate-qr" | "send-message", payload: object }
// Hanya admin yang boleh memanggil endpoint ini.
const MPWA_BASE = "https://app.ayopintar.com";
const ALLOWED = new Set(["generate-qr", "send-message"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { endpoint, payload } = (await req.json()) as { endpoint?: string; payload?: unknown };
    if (!endpoint || !ALLOWED.has(endpoint)) {
      return json({ ok: false, error: "Endpoint tidak diizinkan" }, { status: 404 });
    }
    const upstream = await fetch(`${MPWA_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
